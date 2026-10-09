import { readFileSync } from "node:fs"
import { join } from "node:path"

type Dictionary = Record<string, Record<string, string>>

function load(locale: "fr" | "en") {
  return JSON.parse(
    readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")
  ) as Dictionary
}

const DICTIONARIES = { fr: load("fr"), en: load("en") }

/**
 * Texte de l'interface depuis les fichiers de messages : les tests suivent les
 * traductions au lieu de répéter des libellés en dur.
 */
export function text(locale: "fr" | "en", namespace: string, key: string) {
  const value = DICTIONARIES[locale][namespace]?.[key]
  if (value === undefined) throw new Error(`Message inconnu : ${locale}.${namespace}.${key}`)
  return value
}

/** Variante anglaise, langue des tests par défaut. */
export const en = (namespace: string, key: string) => text("en", namespace, key)
