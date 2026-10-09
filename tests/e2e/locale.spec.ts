import { expect, test } from "@playwright/test"

import { en, text } from "./helpers/messages"

const STORAGE_KEY = "cover-studio-locale"

test.describe("redirection de la racine", () => {
  test.describe("navigateur en français", () => {
    test.use({ locale: "fr-FR" })

    test("ouvre /fr", async ({ page }) => {
      await page.goto("/")
      await expect(page).toHaveURL(/\/fr$/)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(text("fr", "landing", "heroTitle"))
    })
  })

  test.describe("navigateur en anglais", () => {
    test.use({ locale: "en-US" })

    test("ouvre /en", async ({ page }) => {
      await page.goto("/")
      await expect(page).toHaveURL(/\/en$/)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(en("landing", "heroTitle"))
    })

    test("préfère la langue enregistrée à celle du navigateur", async ({ page }) => {
      await page.addInitScript(
        ([key]) => localStorage.setItem(key, "fr"),
        [STORAGE_KEY]
      )
      await page.goto("/")
      await expect(page).toHaveURL(/\/fr$/)
    })
  })

  test.describe("navigateur dans une langue non gérée", () => {
    test.use({ locale: "ja-JP" })

    test("retombe sur la langue par défaut", async ({ page }) => {
      await page.goto("/")
      await expect(page).toHaveURL(/\/en$/)
    })
  })
})

test("le sélecteur de langue change de page et mémorise le choix", async ({ page }) => {
  await page.goto("/en")

  await page
    .getByRole("navigation", { name: en("localeSwitcher", "label") })
    .first()
    .getByRole("link", { name: "Français" })
    .click()

  await expect(page).toHaveURL(/\/fr$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(text("fr", "landing", "heroTitle"))
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("fr")
})
