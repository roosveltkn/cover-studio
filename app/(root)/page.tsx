"use client"

import { useEffect } from "react"

import { detectLocale } from "@/i18n/detect"
import { LOCALE_NAMES, locales } from "@/i18n/routing"

// Export statique : pas de proxy pour lire Accept-Language, la langue est donc
// choisie ici, côté client (préférence enregistrée, puis langue du navigateur).
// Les liens restent visibles : c'est l'`x-default` des moteurs de recherche.
export default function RootRedirectPage() {
  useEffect(() => {
    window.location.replace(`/${detectLocale()}`)
  }, [])

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 16px" }}>Cover Studio</h1>
        <nav style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {locales.map((locale) => (
            <a key={locale} href={`/${locale}`} hrefLang={locale} lang={locale}>
              {LOCALE_NAMES[locale]}
            </a>
          ))}
        </nav>
      </div>
    </main>
  )
}
