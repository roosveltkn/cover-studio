import type { Template, TemplateTag } from "@/types/cover"

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

/** Modèles qui portent toutes les étiquettes cochées (tous si aucune). */
export function filterTemplates(templates: Template[], tags: TemplateTag[]) {
  return templates.filter((template) => tags.every((tag) => template.tags.includes(tag)))
}
