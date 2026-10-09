"use client"

import { useEffect } from "react"

import { detectLocale } from "@/i18n/detect"
import { locales } from "@/i18n/routing"

// Export statique : pas de proxy pour lire Accept-Language, la langue est donc
// choisie ici, côté client (préférence enregistrée, puis langue du navigateur).
export default function RootRedirectPage() {
  useEffect(() => {
    window.location.replace(`/${detectLocale()}`)
  }, [])

  return (
    <noscript>
      {locales.map((locale) => (
        <p key={locale}>
          <a href={`/${locale}`}>{locale}</a>
        </p>
      ))}
    </noscript>
  )
}
