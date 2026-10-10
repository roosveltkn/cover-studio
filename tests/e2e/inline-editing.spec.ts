import { expect, test } from "@playwright/test"

import { openEditor, openPanel } from "./helpers/editor"
import { en } from "./helpers/messages"

// Édition directe sur l'aperçu (docs/INLINE-EDITING.md).
test.describe("édition directe", () => {
  test("le nom se modifie sur l'aperçu et dans le panneau", async ({ page }) => {
    await openEditor(page)
    const preview = page.getByRole("region", { name: en("editor", "previewLabel") })
    const name = preview.getByRole("button", { name: en("fields", "nameMainLabel"), exact: true })

    await name.click()
    const toolbar = page.getByRole("toolbar", { name: en("inlineEditing", "toolbarLabel") })
    await expect(toolbar).toBeVisible()

    await name.click()
    const input = preview.getByRole("textbox", { name: en("fields", "nameMainLabel"), exact: true })
    await expect(input).toBeFocused()
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("Klivar")
    await page.keyboard.press("Enter")

    await expect(preview.getByRole("button", { name: en("fields", "nameMainLabel"), exact: true })).toHaveText("Klivar")
    await openPanel(page, "railContent")
    const settings = page.getByRole("complementary", { name: en("editor", "settingsLabel") })
    await expect(settings.getByLabel(en("fields", "nameMainLabel"), { exact: true })).toHaveValue("Klivar")

    await page.keyboard.press("Escape")
    await expect(toolbar).toBeHidden()
  })

  test("un nom vidé reprend sa valeur", async ({ page }) => {
    await openEditor(page)
    const preview = page.getByRole("region", { name: en("editor", "previewLabel") })
    const name = preview.getByRole("button", { name: en("fields", "nameMainLabel"), exact: true })
    const before = await name.innerText()

    await name.focus()
    await page.keyboard.press("Enter")
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Enter")

    await expect(name).toHaveText(before)
  })

  test("la barre d'outils règle la taille de l'élément", async ({ page }) => {
    await openEditor(page)
    const preview = page.getByRole("region", { name: en("editor", "previewLabel") })
    await preview.getByRole("button", { name: en("fields", "descriptionLabel") }).click()

    const toolbar = page.getByRole("toolbar", { name: en("inlineEditing", "toolbarLabel") })
    await toolbar.getByRole("button", { name: en("inlineEditing", "larger") }).click()
    await expect(toolbar.getByRole("button", { name: en("inlineEditing", "sizeReset") })).toHaveText(/110/)

    // Le réglage est le même que celui du panneau Police.
    await openPanel(page, "railTypography")
    await expect(page.getByText(/110\s?%/).first()).toBeVisible()
  })
})
