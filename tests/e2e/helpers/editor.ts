import { expect, type Locator, type Page } from "@playwright/test"

import { DESKTOP_SCREENSHOT } from "./png"
import { en } from "./messages"

type Screenshot = ReturnType<typeof DESKTOP_SCREENSHOT>

/** Importe une capture sur l'accueil puis ouvre l'éditeur, comme un visiteur. */
export async function openEditor(
  page: Page,
  screenshot: Screenshot = DESKTOP_SCREENSHOT(),
  locale: "fr" | "en" = "en"
) {
  await page.goto(`/${locale}`)
  await page.locator("#landing-image").setInputFiles(screenshot)
  await page.getByRole("button", { name: en("landing", "createButton") }).click()
  await expect(page).toHaveURL(new RegExp(`/${locale}/editor`))
  await expect(page.getByRole("region", { name: en("editor", "previewLabel") })).toBeVisible()
}

/** Ouvre un panneau de l'éditeur depuis le rail latéral. */
export async function openPanel(page: Page, railKey: string) {
  await page
    .getByRole("navigation", { name: en("editor", "railLabel") })
    .getByRole("button", { name: en("editor", railKey) })
    .click()
}

/** Boutons de choix du template, découverts à l'exécution : un nouveau template est testé sans changer le test. */
export function templateButtons(page: Page): Locator {
  return page
    .getByRole("complementary", { name: en("editor", "settingsLabel") })
    .locator("button[aria-pressed]")
}
