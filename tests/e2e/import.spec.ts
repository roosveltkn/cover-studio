import { expect, test } from "@playwright/test"

import { openEditor, openPanel, templateButtons } from "./helpers/editor"
import { en, text } from "./helpers/messages"
import { DESKTOP_SCREENSHOT, MOBILE_SCREENSHOT, screenshot } from "./helpers/png"

test.describe("accueil", () => {
  test("le bouton de création attend une capture", async ({ page }) => {
    await page.goto("/en")
    const create = page.getByRole("button", { name: en("landing", "createButton") })

    await expect(create).toBeDisabled()
    await page.locator("#landing-image").setInputFiles(DESKTOP_SCREENSHOT())
    await expect(create).toBeEnabled()
  })

  test("refuse un fichier qui n'est pas une image", async ({ page }) => {
    await page.goto("/en")
    await page.locator("#landing-image").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("pas une image"),
    })

    await expect(
      page.getByRole("alert").filter({ hasText: en("errors", "unsupportedFormat").split("{")[0] })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: en("landing", "createButton") })).toBeDisabled()
  })

  test("permet de retirer la capture importée", async ({ page }) => {
    await page.goto("/en")
    await page.locator("#landing-image").setInputFiles(DESKTOP_SCREENSHOT())

    await page.getByRole("button", { name: en("gallery", "remove").replace("{name}", "desktop.png") }).click()
    await expect(page.getByRole("button", { name: en("landing", "createButton") })).toBeDisabled()
  })

  test("accepte jusqu'à quatre captures, puis masque l'ajout", async ({ page }) => {
    await page.goto("/en")
    const extra = ["mobile-2", "desktop-2"].map((name) =>
      name.startsWith("mobile")
        ? screenshot(`${name}.png`, 200, 420, [234, 88, 12])
        : screenshot(`${name}.png`, 640, 400, [22, 163, 74])
    )
    await page.locator("#landing-image").setInputFiles([DESKTOP_SCREENSHOT(), MOBILE_SCREENSHOT(), ...extra])

    for (const name of ["desktop.png", "mobile.png", "mobile-2.png", "desktop-2.png"]) {
      await expect(page.getByRole("button", { name: en("gallery", "remove").replace("{name}", name) })).toBeVisible()
    }
    await expect(page.locator("#landing-image")).toHaveCount(0)
    await expect(page.getByRole("button", { name: en("landing", "createButton") })).toBeEnabled()
  })

  test("refuse les captures au-delà de la limite", async ({ page }) => {
    await page.goto("/en")
    await page
      .locator("#landing-image")
      .setInputFiles(
        ["a", "b", "c", "d", "e"].map((name) =>
          screenshot(`${name}.png`, 640, 400, [37, 99, 235])
        )
      )

    await expect(
      page.getByRole("alert").filter({ hasText: en("gallery", "limit").replace("{max}", "4") })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: en("gallery", "remove").replace("{name}", "e.png") })).toHaveCount(0)
  })
})

test.describe("carrousel des modèles", () => {
  test("le modèle choisi sur l'accueil s'ouvre dans l'éditeur", async ({ page }) => {
    await page.goto("/en")
    const carousel = page.getByRole("region", { name: en("landing", "carouselLabel") })
    await carousel.getByRole("button", { name: en("landing", "pauseCarousel") }).click()
    await carousel.getByRole("button", { name: en("landing", "nextTemplate") }).click()
    await carousel.getByRole("button", { name: en("landing", "nextTemplate") }).click()

    const name = en("templates", "bentoName")
    const slide = carousel.getByRole("button", { name: en("landing", "pickTemplate").replace("{name}", name) })
    await slide.click()
    await expect(slide).toHaveAttribute("aria-pressed", "true")

    await page.locator("#landing-image").setInputFiles(DESKTOP_SCREENSHOT())
    await page.getByRole("button", { name: en("landing", "createButton") }).click()
    await expect(templateButtons(page).and(page.locator('[aria-pressed="true"]'))).toContainText(name)
  })
})

test.describe("éditeur", () => {
  test("s'ouvre avec la capture importée", async ({ page }) => {
    await openEditor(page)
    await expect(page.getByRole("region", { name: en("editor", "previewLabel") })).toBeVisible()
  })

  test("s'ouvre avec toutes les captures importées sur l'accueil", async ({ page }) => {
    await page.goto("/en")
    await page.locator("#landing-image").setInputFiles([DESKTOP_SCREENSHOT(), MOBILE_SCREENSHOT()])
    await page.getByRole("button", { name: en("landing", "createButton") }).click()
    await expect(page).toHaveURL(/\/en\/editor/)

    await openPanel(page, "railMockups")
    for (const name of ["desktop.png", "mobile.png"]) {
      await expect(page.getByRole("button", { name: en("gallery", "remove").replace("{name}", name) })).toBeVisible()
    }
  })

  test("une capture portrait ouvre le template mobile", async ({ page }) => {
    await openEditor(page, MOBILE_SCREENSHOT())
    const selected = templateButtons(page).and(page.locator('[aria-pressed="true"]'))

    await expect(selected).toContainText(en("templates", "mobileTrioName"))
  })

  test("un accès direct sans capture renvoie vers l'accueil", async ({ page }) => {
    await page.goto("/en/editor")
    await expect(page).toHaveURL(/\/en\/?$/)
  })

  test("la modification d'un texte se reflète dans l'aperçu", async ({ page }) => {
    await openEditor(page)
    await openPanel(page, "railContent")

    await page.locator("#field-content-nameMain").fill("Zorglub")

    await expect(page.getByRole("region", { name: en("editor", "previewLabel") })).toContainText("Zorglub")
  })

  test("changer de langue conserve le panneau ouvert", async ({ page }) => {
    await openEditor(page)
    await openPanel(page, "railColors")

    await page
      .getByRole("navigation", { name: en("localeSwitcher", "label") })
      .getByRole("link", { name: "Français" })
      .click()

    await expect(page).toHaveURL(/\/fr\/editor/)
    await expect(page.getByRole("complementary").getByRole("heading", { level: 2 })).toHaveText(
      text("fr", "panels", "colorsTitle")
    )
  })
})
