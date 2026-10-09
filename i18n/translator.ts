import type fr from "../messages/fr.json"

/** fr.json fait référence : toute clé absente d'une autre langue échoue au typecheck. */
export type Messages = typeof fr
export type Namespace = keyof Messages
export type MessageKey<N extends Namespace> = keyof Messages[N] & string
export type Values = Record<string, string | number>
export type Translator<N extends Namespace> = (key: MessageKey<N>, values?: Values) => string

/** Remplace les `{nom}` d'un message par les valeurs fournies. */
function interpolate(template: string, values?: Values) {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  )
}

/**
 * Suffixe de clé de pluriel (`xOne` / `xOther`) selon les règles de la langue :
 * en français 0 et 1 sont au singulier, en anglais seul 1 l'est.
 */
export function pluralSuffix(locale: string, count: number): "One" | "Other" {
  return new Intl.PluralRules(locale).select(count) === "one" ? "One" : "Other"
}

// Sans état ni React : utilisable côté serveur (métadonnées) comme côté client.
export function createTranslator<N extends Namespace>(
  messages: Messages,
  namespace: N
): Translator<N> {
  const dictionary = messages[namespace] as Record<string, string>

  return (key, values) => {
    const template = dictionary[key]
    // Une clé inconnue reste visible plutôt que de faire planter la page.
    if (template === undefined) return `${namespace}.${key}`
    return interpolate(template, values)
  }
}
