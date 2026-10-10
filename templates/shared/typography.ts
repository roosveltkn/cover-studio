import { createContext, useContext } from "react"

import type { CoverConfig, TextElement } from "@/types/cover"

/** Police et tailles choisies par l'utilisateur, lues par les blocs de texte. */
export const TypographyContext = createContext<CoverConfig["style"] | null>(
  null
)

/** Multiplicateur de taille d'un élément de texte (1 si non réglé). */
export function useTextScale(element: TextElement) {
  return useContext(TypographyContext)?.textScale?.[element] ?? 1
}
