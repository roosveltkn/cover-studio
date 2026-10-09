import type { Metadata } from "next"

import { MESSAGES } from "@/i18n/messages"
import { OPEN_GRAPH_LOCALES, defaultLocale, locales } from "@/i18n/routing"
import { SITE_URL } from "@/lib/site"

// Layout racine distinct pour « / » : cette page n'a pas de langue, elle redirige
// vers /fr ou /en. Elle ne charge ni polices ni styles de l'application.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: MESSAGES[defaultLocale].meta.siteTitle,
  description: MESSAGES[defaultLocale].meta.siteDescription,
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Cover Studio",
    title: MESSAGES[defaultLocale].meta.siteTitle,
    description: MESSAGES[defaultLocale].meta.siteDescription,
    locale: OPEN_GRAPH_LOCALES[defaultLocale],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: MESSAGES[defaultLocale].meta.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MESSAGES[defaultLocale].meta.siteTitle,
    description: MESSAGES[defaultLocale].meta.siteDescription,
    images: ["/og-image.png"],
  },
}

export default function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  )
}
