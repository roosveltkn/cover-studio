import en from "../messages/en.json"
import fr from "../messages/fr.json"

import type { Locale } from "./routing"
import type { Messages } from "./translator"

// Typé `Record<Locale, Messages>` : une clé manquante dans en.json ne compile pas.
export const MESSAGES: Record<Locale, Messages> = { fr, en }
