"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Vrai tant que la media query correspond (ex. `(min-width: 640px)`).
 * Export statique : faux au rendu serveur, corrigé à l'hydratation.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}
