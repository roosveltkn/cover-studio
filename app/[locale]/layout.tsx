import type { Metadata, Viewport } from "next"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Geist_Mono, Inter, Montserrat, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google"
import { notFound } from "next/navigation"

import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LocaleSync } from "@/i18n/locale-sync"
import { MESSAGES } from "@/i18n/messages"
import { I18nProvider } from "@/i18n/provider"
import { OPEN_GRAPH_LOCALES, hasLocale, locales } from "@/i18n/routing"
import { createTranslator } from "@/i18n/translator"
import { GA_ID } from "@/lib/analytics"
import { LINKS, SITE_URL } from "@/lib/site"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Police du template, embarquée à l'export.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
})

// Autres polices proposées dans l'éditeur (cf. lib/fonts).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-montserrat",
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
})
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-playfair",
})

/** Couleur de la barre d'adresse mobile, alignée sur le logo. */
const BRAND_COLOR = "#7D2AE8"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Export statique : une page par langue, et 404 pour toute autre.
export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const t = createTranslator(MESSAGES[locale], "meta")
  const title = t("siteTitle")
  const description = t("siteDescription")

  return {
    // URL publique du site, nécessaire aux images Open Graph absolues.
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · Cover Studio" },
    description,
    keywords: t("keywords").split(", "),
    applicationName: "Cover Studio",
    authors: [{ name: "Cover Studio", url: LINKS.github }],
    category: "design",
    alternates: {
      canonical: `/${locale}`,
      // x-default : la page racine, qui laisse choisir la langue.
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        "x-default": "/",
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      url: `/${locale}`,
      siteName: "Cover Studio",
      title,
      description,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OPEN_GRAPH_LOCALES[l]),
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("ogImageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/og-image.png", alt: t("ogImageAlt") }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
}

export default async function RootLayout({ children, params }: Readonly<Props>) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        poppins.variable,
        montserrat.variable,
        spaceGrotesk.variable,
        playfair.variable
      )}
    >
      <body>
        <I18nProvider locale={locale}>
          <LocaleSync />
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </I18nProvider>
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
