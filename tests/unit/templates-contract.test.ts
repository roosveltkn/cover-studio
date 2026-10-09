import { describe, expect, it } from "vitest"

import { MESSAGES } from "@/i18n/messages"
import { locales } from "@/i18n/routing"
import { getPath } from "@/lib/path"
import { getTemplate, templates } from "@/templates/registry"
import { defaultConfig } from "@/templates/showcase/defaults"
import type { FieldSchema } from "@/types/cover"

/**
 * Contrat que tout nouveau template doit respecter. Les tests bouclent sur le
 * registre : ajouter un template l'inclut automatiquement, sans nouveau test.
 */
describe("registre des templates", () => {
  it("contient au moins un template, avec des identifiants uniques", () => {
    const ids = templates.map((template) => template.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("retombe sur le premier template pour un identifiant inconnu", () => {
    expect(getTemplate("inconnu")).toBe(templates[0])
    expect(getTemplate(undefined)).toBe(templates[0])
  })
})

describe.each(templates)("template « $id »", (template) => {
  it("a un nom et une description dans chaque langue", () => {
    for (const locale of locales) {
      const dictionary = MESSAGES[locale].templates as Record<string, string>
      expect(dictionary[template.nameKey], `${locale}.${template.nameKey}`).toBeTruthy()
      expect(dictionary[template.descriptionKey], `${locale}.${template.descriptionKey}`).toBeTruthy()
    }
  })

  it("a une taille de canevas valide", () => {
    expect(template.size.width).toBeGreaterThan(0)
    expect(template.size.height).toBeGreaterThan(0)
  })

  it("a des emplacements de capture libellés dans chaque langue, sans doublon de champ", () => {
    expect(template.slots.length).toBeGreaterThan(0)
    for (const locale of locales) {
      const slots = MESSAGES[locale].slots as Record<string, string>
      for (const slot of template.slots) {
        expect(slots[slot.labelKey], `${locale}.slots.${slot.labelKey}`).toBeTruthy()
      }
    }
    const keys = template.slots.map((slot) => slot.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("a des champs dont les libellés existent dans chaque langue", () => {
    const keysOf = (field: FieldSchema) => [
      field.label,
      field.help,
      "placeholder" in field ? field.placeholder : undefined,
      ...("options" in field ? field.options.map((option) => option.label) : []),
    ]

    for (const locale of locales) {
      const fields = MESSAGES[locale].fields as Record<string, string>
      for (const field of template.schema) {
        for (const key of keysOf(field)) {
          if (key) expect(fields[key], `${locale}.fields.${key} (${field.path})`).toBeTruthy()
        }
      }
    }
  })

  it("n'a que des champs qui pointent une valeur de la configuration par défaut", () => {
    const config = defaultConfig("en")
    // Valeurs facultatives : absentes tant que l'utilisateur n'y a pas touché.
    const optional = new Set(["content.icon", "style.fontFamily"])
    for (const field of template.schema) {
      if (field.path.startsWith("style.textScale.") || optional.has(field.path)) continue
      expect(getPath(config, field.path), field.path).not.toBeUndefined()
    }
  })

  it("n'a pas deux champs sur le même chemin", () => {
    const paths = template.schema.map((field) => field.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("expose le champ galerie pour importer les captures", () => {
    expect(template.schema.some((field) => field.type === "gallery")).toBe(true)
  })
})
