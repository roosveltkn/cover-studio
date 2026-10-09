import type { FieldSchema } from "@/types/cover"

import { COLOR_PRESETS } from "@/templates/showcase/defaults"

/** Champs communs aux templates navigateur + téléphone. */
export const baseSchema: FieldSchema[] = [
  {
    type: "text",
    section: "content",
    path: "content.badge",
    label: "Pastille",
    placeholder: "SaaS · Productivité",
    help: "Affichée en majuscules espacées.",
    maxLength: 40,
  },
  {
    type: "text",
    section: "content",
    path: "content.nameMain",
    label: "Nom",
    placeholder: "Mon",
    required: true,
    maxLength: 30,
  },
  {
    type: "text",
    section: "content",
    path: "content.nameAccent",
    label: "Suite du nom (accent)",
    placeholder: "App",
    help: "Optionnel, affichée dans la couleur d'accent.",
    maxLength: 30,
  },
  {
    type: "textarea",
    section: "content",
    path: "content.description",
    label: "Description",
    placeholder: "Ce que fait l'application, en une ou deux phrases.",
    help: "160 caractères maximum recommandés (3 lignes).",
    maxLength: 220,
  },
  {
    type: "list",
    section: "content",
    path: "content.chips",
    label: "Fonctionnalités",
    placeholder: "Ajouter puis Entrée",
  },
  {
    type: "text",
    section: "content",
    path: "content.footer",
    label: "Pied de page",
    placeholder: "monapp.com · Tech Lead",
  },
  {
    type: "text",
    section: "content",
    path: "content.browserUrl",
    label: "URL du navigateur",
    placeholder: "monapp.com",
  },
  {
    type: "color",
    section: "colors",
    path: "style.brandColor",
    label: "Couleur de marque",
    help: "Le fond, le halo, les chips et l'accent en sont dérivés.",
    presets: COLOR_PRESETS,
  },
  {
    type: "icon",
    section: "mockups",
    path: "content.icon",
    label: "Icône de l'application",
    help: "Carrée de préférence, 512 × 512 px ou plus. Affichée à côté du nom, hors des 6 captures.",
  },
  {
    type: "gallery",
    section: "mockups",
    path: "mockups.images",
    label: "Captures",
    help: "Glissez pour changer l'ordre : il décide de l'emplacement de chaque capture.",
  },
  {
    type: "segmented",
    section: "mockups",
    path: "mockups.browserTheme",
    label: "Thème du navigateur",
    options: [
      { value: "auto", label: "Auto" },
      { value: "light", label: "Clair" },
      { value: "dark", label: "Sombre" },
    ],
  },
]

const DESKTOP_ONLY = ["content.browserUrl", "mockups.browserTheme"]

/** Mobile trio : pas de navigateur. */
export const mobileTrioSchema: FieldSchema[] = baseSchema.filter(
  (field) => !DESKTOP_ONLY.includes(field.path)
)
