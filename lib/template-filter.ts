import type { Template, TemplateFilter, TemplateTag } from "@/types/cover"

/** Ordre d'affichage des étiquettes de filtre. */
export const TEMPLATE_TAGS: TemplateTag[] = [
  "mobile",
  "desktop",
  "light",
  "dark",
  "colorful",
  "minimal",
  "playful",
]

export const EMPTY_FILTER: TemplateFilter = { query: "", tags: [] }

/** Minuscules sans accents : « Éditorial » est trouvé en tapant « editorial ». */
export function normalizeSearch(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
}

export function isFilterActive(filter: TemplateFilter) {
  return filter.query.trim() !== "" || filter.tags.length > 0
}

/**
 * Modèles qui portent toutes les étiquettes cochées et dont les textes
 * (traduits par l'appelant) contiennent chaque mot de la recherche.
 */
export function filterTemplates(
  templates: Template[],
  filter: TemplateFilter,
  textsOf: (template: Template) => string[]
) {
  const words = normalizeSearch(filter.query).split(/\s+/).filter(Boolean)
  return templates.filter((template) => {
    if (!filter.tags.every((tag) => template.tags.includes(tag))) return false
    if (words.length === 0) return true
    const haystack = normalizeSearch(textsOf(template).join(" "))
    return words.every((word) => haystack.includes(word))
  })
}
