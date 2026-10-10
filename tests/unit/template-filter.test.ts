import { describe, expect, it } from "vitest"

import { filterTemplates } from "@/lib/template-filter"
import { templates } from "@/templates/registry"
import type { Template, TemplateTag } from "@/types/cover"

/** Modèle factice : seuls l'identifiant et les étiquettes comptent pour le filtre. */
function fake(id: string, tags: TemplateTag[]) {
  return { ...templates[0], id, tags } satisfies Template
}

const LIST = [fake("aurora", ["desktop", "dark", "colorful"]), fake("trio", ["mobile", "light"])]
const ids = (list: Template[]) => list.map((template) => template.id)

describe("filterTemplates", () => {
  it("renvoie tout sans étiquette cochée", () => {
    expect(ids(filterTemplates(LIST, []))).toEqual(["aurora", "trio"])
  })

  it("exige toutes les étiquettes cochées", () => {
    expect(ids(filterTemplates(LIST, ["dark"]))).toEqual(["aurora"])
    expect(ids(filterTemplates(LIST, ["dark", "colorful"]))).toEqual(["aurora"])
    expect(ids(filterTemplates(LIST, ["dark", "mobile"]))).toEqual([])
  })
})
