"use client"

import NextLink from "next/link"
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation"
import { useMemo, type ComponentProps } from "react"

import { useLocale } from "./provider"
import { hasLocale, type Locale } from "./routing"

/** `/editor` + `fr` → `/fr/editor`. */
export function localizePath(locale: Locale, href: string) {
  return href === "/" ? `/${locale}` : `/${locale}${href}`
}

/** `/fr/editor` → `/editor`. Sans préfixe de langue, le chemin est rendu tel quel. */
export function stripLocale(pathname: string) {
  const [, first] = pathname.split("/")
  if (!hasLocale(first)) return pathname
  return pathname.slice(first.length + 1) || "/"
}

// Équivalents de next/link et next/navigation qui gardent la langue courante.
// Les chemins passés et reçus sont toujours sans préfixe de langue.
export function Link({
  href,
  locale,
  ...props
}: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string; locale?: Locale }) {
  const current = useLocale()
  return <NextLink href={localizePath(locale ?? current, href)} {...props} />
}

export function usePathname() {
  return stripLocale(useNextPathname())
}

export function useRouter() {
  const router = useNextRouter()
  const locale = useLocale()

  return useMemo(
    () => ({
      push: (href: string) => router.push(localizePath(locale, href)),
      replace: (href: string) => router.replace(localizePath(locale, href)),
      prefetch: (href: string) => router.prefetch(localizePath(locale, href)),
    }),
    [router, locale]
  )
}
