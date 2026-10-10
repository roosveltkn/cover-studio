import { describe, expect, it } from "vitest"

import { EMPTY_FILTER, filterTemplates, isFilterActive, normalizeSearch } from "@/lib/template-filter"
import { templates } from "@/templates/registry"
import type { Template, TemplateTag } from "@/types/cover"

/** Modèle factice : seuls l'identifiant et les étiquettes comptent pour le filtre. */
function fake(id: string, tags: TemplateTag[]) {
  return { ...templates[0], id, tags } satisfies Template
}

const LIST = [fake("aurora", ["desktop", "dark", "colorful"]), fake("trio", ["mobile", "light"])]
const TEXTS: Record<string, string[]> = {
  aurora: ["Aurora", "Dégradé maillé et carte de verre"],
  trio: ["Mobile trio", "Trois téléphones"],
}
const textsOf = (template: Template) => TEXTS[template.id]
const ids = (list: Template[]) => list.map((template) => template.id)

describe("normalizeSearch", () => {
  it("ignore la casse et les accents", () => {
    expect(normalizeSearch("  Dégradé ÉDITORIAL ")).toBe("degrade editorial")
  })
})

describe("filterTemplates", () => {
  it("renvoie tout sans recherche ni étiquette", () => {
    expect(ids(filterTemplates(LIST, EMPTY_FILTER, textsOf))).toEqual(["aurora", "trio"])
  })

  it("cherche dans les textes, sans tenir compte des accents", () => {
    expect(ids(filterTemplates(LIST, { query: "degrade", tags: [] }, textsOf))).toEqual(["aurora"])
  })

  it("exige chaque mot de la recherche", () => {
    expect(ids(filterTemplates(LIST, { query: "trois verre", tags: [] }, textsOf))).toEqual([])
    expect(ids(filterTemplates(LIST, { query: "trois mobile", tags: [] }, textsOf))).toEqual(["trio"])
  })

  it("exige toutes les étiquettes cochées", () => {
    expect(ids(filterTemplates(LIST, { query: "", tags: ["dark"] }, textsOf))).toEqual(["aurora"])
    expect(ids(filterTemplates(LIST, { query: "", tags: ["dark", "mobile"] }, textsOf))).toEqual([])
  })
})

describe("isFilterActive", () => {
  it("ignore une recherche faite d'espaces", () => {
    expect(isFilterActive({ query: "  ", tags: [] })).toBe(false)
    expect(isFilterActive({ query: "", tags: ["light"] })).toBe(true)
  })
})
