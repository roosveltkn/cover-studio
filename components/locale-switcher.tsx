"use client"

import { saveLocale } from "@/i18n/detect"
import { Link, usePathname } from "@/i18n/navigation"
import { useLocale, useTranslations } from "@/i18n/provider"
import { LOCALE_NAMES, locales } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  /** `onGradient` : texte blanc, pour la barre colorée de l'éditeur. */
  tone?: "default" | "onGradient"
  className?: string
}

export function LocaleSwitcher({ tone = "default", className }: Props) {
  const t = useTranslations("localeSwitcher")
  const current = useLocale()
  // Chemin sans préfixe de langue : le Link ajoute celui de la langue cible.
  const pathname = usePathname()

  return (
    <nav aria-label={t("label")} className={cn("flex items-center gap-0.5", className)}>
      {locales.map((locale) => {
        const active = locale === current
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            lang={locale}
            aria-label={LOCALE_NAMES[locale]}
            aria-current={active ? "true" : undefined}
            onClick={() => saveLocale(locale)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold uppercase outline-none focus-visible:ring-3",
              tone === "onGradient"
                ? "focus-visible:ring-white/60"
                : "focus-visible:ring-ring/50",
              active
                ? tone === "onGradient"
                  ? "bg-white/20 text-white"
                  : "bg-secondary text-secondary-foreground"
                : tone === "onGradient"
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {locale}
          </Link>
        )
      })}
    </nav>
  )
}
