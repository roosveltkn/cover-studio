import { describe, expect, it } from "vitest"

import { acceptLanguage, parseLanguage } from "../lib/language.js"

describe("parseLanguage", () => {
  it.each([
    ["fr", "fr"],
    ["EN", "en"],
    ["pt-br", "pt-BR"],
    [" de ", "de"],
  ])("%s → %s", (input, expected) => {
    expect(parseLanguage(input)).toBe(expected)
  })

  it.each([null, "", "français", "fr-FR-x", "f1", "en;q=0.5"])(
    "retombe sur l'anglais pour %s",
    (input) => {
      expect(parseLanguage(input)).toBe("en")
    }
  )
})

describe("acceptLanguage", () => {
  it("préfère la langue demandée, puis l'anglais", () => {
    expect(acceptLanguage("fr")).toBe("fr,en;q=0.8")
    expect(acceptLanguage("pt-BR")).toBe("pt-BR,pt;q=0.9,en;q=0.8")
    expect(acceptLanguage("en")).toBe("en")
    expect(acceptLanguage("en-GB")).toBe("en-GB,en;q=0.9")
  })
})
