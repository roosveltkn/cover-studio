import { afterEach, describe, expect, it, vi } from "vitest"

import { detectLocale, saveLocale } from "@/i18n/detect"
import { LOCALE_STORAGE_KEY, defaultLocale } from "@/i18n/routing"

function stubBrowser({ languages, stored }: { languages: string[]; stored?: string | Error }) {
  vi.stubGlobal("navigator", { languages, language: languages[0] })
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => {
      if (stored instanceof Error) throw stored
      return key === LOCALE_STORAGE_KEY ? (stored ?? null) : null
    },
    setItem: vi.fn(),
  })
}

afterEach(() => vi.unstubAllGlobals())

describe("detectLocale", () => {
  it("préfère la langue enregistrée à celle du navigateur", () => {
    stubBrowser({ languages: ["en-US"], stored: "fr" })
    expect(detectLocale()).toBe("fr")
  })

  it("ignore une valeur enregistrée inconnue", () => {
    stubBrowser({ languages: ["fr-CA"], stored: "de" })
    expect(detectLocale()).toBe("fr")
  })

  it("retombe sur la langue du navigateur, région ignorée", () => {
    stubBrowser({ languages: ["fr-FR", "en-US"] })
    expect(detectLocale()).toBe("fr")
  })

  it("prend la première langue du navigateur que l'on sait traiter", () => {
    stubBrowser({ languages: ["de-DE", "en-GB", "fr-FR"] })
    expect(detectLocale()).toBe("en")
  })

  it("utilise la langue par défaut si rien ne correspond", () => {
    stubBrowser({ languages: ["de-DE", "ja"] })
    expect(detectLocale()).toBe(defaultLocale)
  })

  it("survit à un stockage indisponible", () => {
    stubBrowser({ languages: ["fr-FR"], stored: new Error("SecurityError") })
    expect(detectLocale()).toBe("fr")
  })
})

describe("saveLocale", () => {
  it("ne lève pas d'erreur si le stockage est bloqué", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("QuotaExceededError")
      },
    })
    expect(() => saveLocale("fr")).not.toThrow()
  })
})
