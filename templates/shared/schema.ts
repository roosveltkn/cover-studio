import type { FieldSchema } from "@/types/cover"

import { COLOR_PRESETS } from "@/templates/showcase/defaults"

/** Champs communs aux templates navigateur + téléphone. */
export const baseSchema: FieldSchema[] = [
  {
    type: "text",
    section: "content",
    path: "content.badge",
    label: "badgeLabel",
    placeholder: "badgePlaceholder",
    help: "badgeHelp",
    maxLength: 40,
  },
  {
    type: "text",
    section: "content",
    path: "content.nameMain",
    label: "nameMainLabel",
    placeholder: "nameMainPlaceholder",
    required: true,
    maxLength: 30,
  },
  {
    type: "text",
    section: "content",
    path: "content.nameAccent",
    label: "nameAccentLabel",
    placeholder: "nameAccentPlaceholder",
    help: "nameAccentHelp",
    maxLength: 30,
  },
  {
    type: "textarea",
    section: "content",
    path: "content.description",
    label: "descriptionLabel",
    placeholder: "descriptionPlaceholder",
    help: "descriptionHelp",
    maxLength: 220,
  },
  {
    type: "list",
    section: "content",
    path: "content.chips",
    label: "chipsLabel",
    placeholder: "chipsPlaceholder",
  },
  {
    type: "text",
    section: "content",
    path: "content.footer",
    label: "footerLabel",
    placeholder: "footerPlaceholder",
  },
  {
    type: "text",
    section: "content",
    path: "content.browserUrl",
    label: "browserUrlLabel",
    placeholder: "browserUrlPlaceholder",
  },
  { type: "font", section: "typography", path: "style.fontFamily", label: "fontFamilyLabel" },
  { type: "scale", section: "typography", path: "style.textScale.badge", label: "scaleBadgeLabel" },
  { type: "scale", section: "typography", path: "style.textScale.name", label: "scaleNameLabel" },
  {
    type: "scale",
    section: "typography",
    path: "style.textScale.description",
    label: "scaleDescriptionLabel",
  },
  { type: "scale", section: "typography", path: "style.textScale.chips", label: "scaleChipsLabel" },
  { type: "scale", section: "typography", path: "style.textScale.footer", label: "scaleFooterLabel" },
  {
    type: "color",
    section: "colors",
    path: "style.brandColor",
    label: "brandColorLabel",
    help: "brandColorHelp",
    presets: COLOR_PRESETS,
  },
  {
    type: "icon",
    section: "mockups",
    path: "content.icon",
    label: "iconLabel",
    help: "iconHelp",
  },
  {
    type: "gallery",
    section: "mockups",
    path: "mockups.images",
    label: "galleryLabel",
    help: "galleryHelp",
  },
  {
    type: "segmented",
    section: "mockups",
    path: "mockups.browserTheme",
    label: "browserThemeLabel",
    options: [
      { value: "auto", label: "themeAuto" },
      { value: "light", label: "themeLight" },
      { value: "dark", label: "themeDark" },
    ],
  },
]

const DESKTOP_ONLY = ["content.browserUrl", "mockups.browserTheme"]

/** Mobile trio : pas de navigateur. */
export const mobileTrioSchema: FieldSchema[] = baseSchema.filter(
  (field) => !DESKTOP_ONLY.includes(field.path)
)
