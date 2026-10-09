import { describe, expect, it } from "vitest"

import { MESSAGES } from "@/i18n/messages"
import { locales } from "@/i18n/routing"
import { createTranslator, pluralSuffix } from "@/i18n/translator"

describe("createTranslator", () => {
  it("renvoie le texte du namespace", () => {
    const t = createTranslator(MESSAGES.en, "export")
    expect(t("downloadPng")).toBe("Download PNG")
  })

  it("interpole les variables", () => {
    const t = createTranslator(MESSAGES.en, "export")
    expect(t("pixels", { width: 2400, height: 1500 })).toBe("2400 × 1500 px")
  })

  it("laisse visible une variable non fournie", () => {
    const t = createTranslator(MESSAGES.en, "export")
    expect(t("pixels", { width: 10 })).toBe("10 × {height} px")
  })

  it("rend la clé complète quand elle est inconnue, sans lever d'erreur", () => {
    const t = createTranslator(MESSAGES.en, "export")
    // @ts-expect-error clé volontairement inexistante
    expect(t("nope")).toBe("export.nope")
  })

  it("traduit dans chaque langue", () => {
    for (const locale of locales) {
      const t = createTranslator(MESSAGES[locale], "export")
      expect(t("downloadPng")).toBeTruthy()
    }
  })
})

describe("pluralSuffix", () => {
  it("français : 0 et 1 sont au singulier", () => {
    expect(pluralSuffix("fr", 0)).toBe("One")
    expect(pluralSuffix("fr", 1)).toBe("One")
    expect(pluralSuffix("fr", 2)).toBe("Other")
  })

  it("anglais : seul 1 est au singulier", () => {
    expect(pluralSuffix("en", 0)).toBe("Other")
    expect(pluralSuffix("en", 1)).toBe("One")
    expect(pluralSuffix("en", 2)).toBe("Other")
  })
})
