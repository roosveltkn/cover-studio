import { expect, test } from "@playwright/test"

import { openEditor, templateButtons } from "./helpers/editor"
import { en } from "./helpers/messages"

test.describe("panneau des modèles", () => {
  test("une combinaison sans résultat se réinitialise", async ({ page }) => {
    await openEditor(page)
    const tags = page.getByRole("group", { name: en("templatesPanel", "tagsLabel") })
    const all = await templateButtons(page).count()

    await tags.getByRole("button", { name: en("templateTags", "mobile") }).click()
    await tags.getByRole("button", { name: en("templateTags", "desktop") }).click()
    await expect(page.getByText(en("templatesPanel", "empty"))).toBeVisible()

    await page.getByRole("button", { name: en("templatesPanel", "reset") }).click()
    await expect(templateButtons(page)).toHaveCount(all)
  })

  test("les étiquettes se cumulent", async ({ page }) => {
    await openEditor(page)
    const tags = page.getByRole("group", { name: en("templatesPanel", "tagsLabel") })
    const all = await templateButtons(page).count()

    await tags.getByRole("button", { name: en("templateTags", "dark") }).click()
    const dark = await templateButtons(page).count()
    expect(dark).toBeGreaterThan(0)
    expect(dark).toBeLessThan(all)

    await tags.getByRole("button", { name: en("templateTags", "minimal") }).click()
    expect(await templateButtons(page).count()).toBeLessThanOrEqual(dark)
    await expect(tags.getByRole("button", { name: en("templateTags", "dark") })).toHaveAttribute("aria-pressed", "true")
  })
})
