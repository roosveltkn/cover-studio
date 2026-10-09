import { MESSAGES } from "@/i18n/messages"
import { defaultLocale, locales, type Locale } from "@/i18n/routing"
import { createTranslator } from "@/i18n/translator"
import type { CoverConfig } from "@/types/cover"

export const DEFAULT_BRAND = "#7d2ae8"

export const DEFAULT_TEMPLATE = "showcase"

type Content = CoverConfig["content"]

/** Textes de départ dans une langue : l'utilisateur part de ses propres captures. */
function defaultContent(locale: Locale): Content {
  const t = createTranslator(MESSAGES[locale], "defaults")
  return {
    badge: t("badge"),
    nameMain: t("nameMain"),
    nameAccent: t("nameAccent"),
    description: t("description"),
    chips: [t("chipKeyFeature"), t("chipResponsive"), t("chipOpenSource")],
    footer: t("footer"),
    browserUrl: t("browserUrl"),
  }
}

/** Configuration de départ, avec les textes d'exemple de la langue demandée. */
export function defaultConfig(locale: Locale): CoverConfig {
  return {
    template: DEFAULT_TEMPLATE,
    content: defaultContent(locale),
    style: { brandColor: DEFAULT_BRAND },
    mockups: { images: [], browserTheme: "auto" },
    export: { format: "png", scale: 1 },
  }
}

/** État initial du store, avant que la langue de la page soit connue. */
export const DEFAULT_CONFIG = defaultConfig(defaultLocale)

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Traduit les textes d'exemple vers `locale` sans toucher à ceux de l'utilisateur :
 * un champ n'est remplacé que s'il vaut encore le texte d'exemple d'une autre langue.
 */
export function localizeContent(content: Content, locale: Locale): Content {
  const target = defaultContent(locale)
  const others = locales.filter((other) => other !== locale).map(defaultContent)

  const next = { ...content }
  for (const key of Object.keys(target) as (keyof Omit<Content, "icon">)[]) {
    if (others.some((other) => same(other[key], content[key]))) {
      Object.assign(next, { [key]: target[key] })
    }
  }
  return next
}

/** Couleurs proposées dans le sélecteur, dont les cas limites de contraste. */
export const COLOR_PRESETS = [
  "#7d2ae8",
  "#4f46e5",
  "#2563eb",
  "#06b6d4",
  "#16a34a",
  "#facc15",
  "#f97316",
  "#ef4444",
  "#db2777",
  "#000000",
]
