import type { Metadata } from "next"

import { MESSAGES } from "@/i18n/messages"
import { locales } from "@/i18n/routing"
import { SITE_URL } from "@/lib/site"

// Layout racine distinct pour « / » : cette page n'a pas de langue, elle redirige
// vers /fr ou /en. Elle ne charge ni polices ni styles de l'application.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cover Studio",
  description: locales.map((locale) => MESSAGES[locale].meta.siteDescription).join(" · "),
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
  },
}

export default function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
