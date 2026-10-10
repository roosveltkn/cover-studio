/** Langue par défaut quand l'app n'en précise pas : l'anglais est le plus servi. */
export const DEFAULT_LANGUAGE = "en"

/**
 * Langue demandée par l'app (`lang=fr`, `lang=pt-BR`), pour que les sites
 * multilingues servent la même langue que l'interface. Toute valeur invalide
 * retombe sur la langue par défaut plutôt que d'échouer.
 */
export function parseLanguage(value: string | null): string {
  const match = /^([a-z]{2})(?:-([a-z]{2}))?$/i.exec(value?.trim() ?? "")
  if (!match) return DEFAULT_LANGUAGE
  const [, language, region] = match
  return region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase()
}

/** En-tête Accept-Language : la langue demandée, puis sa langue de base, puis l'anglais. */
export function acceptLanguage(language: string): string {
  const base = language.slice(0, 2)
  const preferences = [language]
  if (base !== language) preferences.push(`${base};q=0.9`)
  if (base !== "en") preferences.push("en;q=0.8")
  return preferences.join(",")
}
