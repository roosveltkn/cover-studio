import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Poppins } from "next/font/google"
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

/** Fond des icônes et de la barre d'adresse mobile, aligné sur le logo. */
const BRAND_DARK = "#050712"

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
  const description = t("siteDescription")

  return {
    // URL publique du site, nécessaire aux images Open Graph absolues.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: "Cover Studio", template: "%s · Cover Studio" },
    description,
    applicationName: "Cover Studio",
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/cover-studio-symbol.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: "Cover Studio",
      title: "Cover Studio",
      description,
      locale: OPEN_GRAPH_LOCALES[locale],
      images: [
        { url: "/cover-studio-preview.jpg", width: 840, height: 725, alt: t("ogImageAlt") },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cover Studio",
      description,
      images: ["/cover-studio-preview.jpg"],
    },
  }
}

export const viewport: Viewport = {
  themeColor: BRAND_DARK,
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
        poppins.variable
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
    </html>
  )
}
