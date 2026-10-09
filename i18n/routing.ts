export const locales = ["fr", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "fr"

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}

/** Clé localStorage du choix de langue, lue par la page racine pour rediriger. */
export const LOCALE_STORAGE_KEY = "cover-studio-locale"

/** Libellés des langues dans leur propre langue : jamais traduits. */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
}

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
}
