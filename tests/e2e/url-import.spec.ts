import { expect, test, type Page, type Route } from "@playwright/test"

import { en, text } from "./helpers/messages"
import { solidPng } from "./helpers/png"

/**
 * Capture depuis une URL, contre un service simulé (`page.route`) : aucun
 * appel réseau réel. Les routes visent les chemins `/api/discover` et
 * `/api/capture` quel que soit le domaine configuré au build.
 */

const SITE = "https://mysite.com/"

const PAGES = [
  { path: "/", label: null, group: "home", source: "link" },
  { path: "/pricing", label: "Pricing", group: "navigation", source: "nav" },
  { path: "/features", label: "Features", group: "navigation", source: "nav" },
  { path: "/docs", label: "Docs", group: "navigation", source: "nav" },
  { path: "/about", label: "About", group: "pages", source: "link" },
].map((page) => ({ ...page, url: new URL(page.path, SITE).href }))

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "X-Capture-Url",
}

type Service = {
  /** Requêtes reçues par `/api/capture`, sous la forme `device url`. */
  captures: string[]
  languages: string[]
}

async function mockService(
  page: Page,
  options: { discover?: (route: Route) => Promise<void> } = {}
): Promise<Service> {
  const service: Service = { captures: [], languages: [] }

  await page.route(/\/api\/discover\?/, async (route) => {
    const url = new URL(route.request().url())
    service.languages.push(url.searchParams.get("lang") ?? "")
    if (options.discover) return options.discover(route)
    await route.fulfill({
      headers: CORS,
      json: { site: SITE, pages: PAGES, total: PAGES.length, meta: { title: "My site" } },
    })
  })

  await page.route(/\/api\/capture\?/, async (route) => {
    const url = new URL(route.request().url())
    const device = url.searchParams.get("device")
    const target = url.searchParams.get("url") ?? SITE
    service.captures.push(`${device} ${target}`)
    // Une vraie image : le navigateur la décode comme un fichier importé.
    const body =
      device === "mobile" ? solidPng(195, 422, [22, 163, 74]) : solidPng(720, 450, [37, 99, 235])
    await route.fulfill({
      headers: { ...CORS, "Content-Type": "image/png", "X-Capture-Url": target },
      body,
    })
  })

  return service
}

/** Ouvre l'accueil en mode « Depuis une URL » ; ignore le test si le service n'est pas configuré. */
async function openUrlMode(page: Page) {
  await page.goto("/en")
  const mode = page.getByRole("button", { name: en("urlImport", "modeUrl") })
  test.skip(
    (await mode.count()) === 0,
    "Build sans NEXT_PUBLIC_CAPTURE_ENDPOINT : la capture depuis une URL est masquée."
  )
  await mode.click()
}

async function analyze(page: Page, address = "mysite.com") {
  await page.getByPlaceholder(en("urlImport", "urlPlaceholder")).fill(address)
  await page.getByRole("button", { name: en("urlImport", "analyze") }).click()
  const dialog = page.getByRole("dialog", { name: "mysite.com" })
  await expect(dialog).toBeVisible()
  return dialog
}

const summary = (count: number, max: number) =>
  en("urlImport", "selectionSummary")
    .replace("{count}", String(count))
    .replace("{max}", String(max))

const captureButton = (count: number) =>
  en("urlImport", "captureCount").replace("{count}", String(count))

const removeButton = (name: string) => en("gallery", "remove").replace("{name}", name)

test.describe("capture depuis une URL", () => {
  test("analyse le site, capture 2 pages en web et mobile et les ajoute à la galerie", async ({
    page,
  }) => {
    const service = await mockService(page)
    await openUrlMode(page)
    const dialog = await analyze(page)

    // L'accueil est coché d'office ; deux appareils, donc 2 pages au plus.
    await expect(dialog.getByText(summary(1, 2))).toBeVisible()
    await dialog.getByText("Pricing", { exact: true }).click()
    await expect(dialog.getByText(summary(2, 2))).toBeVisible()
    await expect(
      dialog.getByText(en("urlImport", "pagesLimitReached").replace("{max}", "2"))
    ).toBeVisible()

    await dialog.getByRole("button", { name: captureButton(4) }).click()

    for (const name of [
      "mysite.com-desktop.webp",
      "mysite.com-mobile.webp",
      "mysite.com-pricing-desktop.webp",
      "mysite.com-pricing-mobile.webp",
    ]) {
      await expect(page.getByRole("button", { name: removeButton(name) })).toBeVisible()
    }
    // Tout a réussi : la fenêtre se ferme, et la galerie pleine masque l'ajout.
    await expect(dialog).toBeHidden()
    await expect(page.getByRole("button", { name: en("urlImport", "modeUrl") })).toHaveCount(0)
    expect(service.captures).toHaveLength(4)
    expect(service.languages).toEqual(["en"])
  })

  test("un seul appareil permet 4 pages, en revenir à deux signale l'excès", async ({ page }) => {
    await mockService(page)
    await openUrlMode(page)
    const dialog = await analyze(page)

    await dialog.getByRole("button", { name: en("urlImport", "mobile"), exact: true }).click()
    await expect(dialog.getByText(summary(1, 4))).toBeVisible()
    for (const label of ["Pricing", "Features", "Docs"]) {
      await dialog.getByText(label, { exact: true }).click()
    }
    await expect(dialog.getByText(summary(4, 4))).toBeVisible()
    await expect(dialog.getByRole("button", { name: captureButton(4) })).toBeEnabled()

    await dialog.getByRole("button", { name: en("urlImport", "mobile"), exact: true }).click()
    await expect(
      dialog.getByRole("alert").filter({
        hasText: en("urlImport", "tooManyPages").replace("{max}", "2"),
      })
    ).toBeVisible()
    await expect(dialog.getByRole("button", { name: captureButton(8) })).toBeDisabled()
  })

  test("l'aperçu au clic est réutilisé par la capture finale", async ({ page }) => {
    const service = await mockService(page)
    await openUrlMode(page)
    const dialog = await analyze(page)

    await dialog
      .getByRole("button", { name: en("urlImport", "previewShow").replace("{page}", "Pricing") })
      .click()
    await expect(
      dialog.getByRole("img", { name: en("urlImport", "previewAlt").replace("{page}", "Pricing") })
    ).toBeVisible()
    expect(service.captures).toEqual([`desktop ${SITE}pricing`])

    // Ordinateur seul, accueil + Pricing : seule la capture de l'accueil est nouvelle.
    await dialog.getByRole("button", { name: en("urlImport", "mobile"), exact: true }).click()
    await dialog.getByText("Pricing", { exact: true }).click()
    await dialog.getByRole("button", { name: captureButton(2) }).click()

    await expect(
      page.getByRole("button", { name: removeButton("mysite.com-pricing-desktop.webp") })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: removeButton("mysite.com-desktop.webp") })
    ).toBeVisible()
    expect(service.captures.filter((capture) => capture.includes("pricing"))).toHaveLength(1)
  })

  test("traduit les erreurs du service", async ({ page }) => {
    await mockService(page, {
      discover: (route) => route.fulfill({ status: 502, headers: CORS, json: { code: "blocked" } }),
    })
    await openUrlMode(page)
    await page.getByPlaceholder(en("urlImport", "urlPlaceholder")).fill("mysite.com")
    await page.getByRole("button", { name: en("urlImport", "analyze") }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: en("errors", "captureBlocked") })
    ).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("signale le rate limiting du firewall", async ({ page }) => {
    await mockService(page, {
      discover: (route) => route.fulfill({ status: 429, headers: CORS, body: "Too Many Requests" }),
    })
    await openUrlMode(page)
    await page.getByPlaceholder(en("urlImport", "urlPlaceholder")).fill("mysite.com")
    await page.getByRole("button", { name: en("urlImport", "analyze") }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: en("errors", "captureRateLimited") })
    ).toBeVisible()
  })

  test("refuse une adresse sans extension sans appeler le service", async ({ page }) => {
    const service = await mockService(page)
    await openUrlMode(page)
    await page.getByPlaceholder(en("urlImport", "urlPlaceholder")).fill("mysite")
    await page.getByRole("button", { name: en("urlImport", "analyze") }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: en("errors", "captureInvalidUrl") })
    ).toBeVisible()
    expect(service.languages).toHaveLength(0)
  })

  test("parle la langue de l'interface au service", async ({ page }) => {
    const service = await mockService(page)
    await page.goto("/fr")
    const mode = page.getByRole("button", { name: text("fr", "urlImport", "modeUrl") })
    test.skip((await mode.count()) === 0, "Service de capture non configuré au build.")
    await mode.click()
    await page.getByPlaceholder(text("fr", "urlImport", "urlPlaceholder")).fill("mysite.com")
    await page.getByRole("button", { name: text("fr", "urlImport", "analyze") }).click()

    await expect(page.getByRole("dialog", { name: "mysite.com" })).toBeVisible()
    expect(service.languages).toEqual(["fr"])
  })
})
