import { expect, test } from "@playwright/test"

import { openEditor, openPanel } from "./helpers/editor"
import { en, text } from "./helpers/messages"
import { DESKTOP_SCREENSHOT, MOBILE_SCREENSHOT } from "./helpers/png"

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

    await page.getByRole("button", { name: en("fileInput", "remove").replace("{name}", "desktop.png") }).click()
    await expect(page.getByRole("button", { name: en("landing", "createButton") })).toBeDisabled()
  })
})

test.describe("éditeur", () => {
  test("s'ouvre avec la capture importée", async ({ page }) => {
    await openEditor(page)
    await expect(page.getByRole("region", { name: en("editor", "previewLabel") })).toBeVisible()
  })

  test("une capture portrait ouvre le template mobile", async ({ page }) => {
    await openEditor(page, MOBILE_SCREENSHOT())
    const selected = page
      .getByRole("complementary", { name: en("editor", "settingsLabel") })
      .locator('button[aria-pressed="true"]')

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
