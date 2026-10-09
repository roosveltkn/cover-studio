import { LOCALE_STORAGE_KEY, defaultLocale, hasLocale, type Locale } from "./routing"

/** Mémorise la langue choisie. Silencieux si le stockage est indisponible. */
export function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Navigation privée ou stockage bloqué : le choix ne sera pas retenu.
  }
}

/** Langue à ouvrir depuis « / » : préférence enregistrée, sinon navigateur, sinon défaut. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (hasLocale(saved)) return saved
  } catch {
    // Stockage indisponible : on retombe sur la langue du navigateur.
  }

  for (const language of navigator.languages ?? [navigator.language]) {
    const base = language.toLowerCase().split("-")[0]
    if (hasLocale(base)) return base
  }

  return defaultLocale
}
