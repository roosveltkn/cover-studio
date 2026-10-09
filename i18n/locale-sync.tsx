"use client"

import { useEffect } from "react"

import { useCoverStore } from "@/stores/cover-store"

import { useLocale } from "./provider"

/** Aligne les textes d'exemple du store sur la langue de la page. Ne rend rien. */
export function LocaleSync() {
  const locale = useLocale()
  const applyLocale = useCoverStore((state) => state.applyLocale)

  useEffect(() => {
    applyLocale(locale)
  }, [applyLocale, locale])

  return null
}
