"use client"

import { Logo } from "@/components/logo"
import { useTranslations } from "@/i18n/provider"
import { LINKS } from "@/lib/site"

const LINK_ITEMS = [
  { key: "github", href: LINKS.github },
  { key: "issues", href: LINKS.issues },
  { key: "license", href: LINKS.license },
] as const

export function SiteFooter() {
  const t = useTranslations("footer")

  return (
    <footer className="border-t border-foreground/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <span className="flex items-center gap-3">
            <Logo className="size-9" />
            <span className="font-semibold">Cover Studio</span>
          </span>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <nav aria-label={t("navLabel")} className="flex flex-col gap-3">
          <span className="text-[13px] font-semibold">{t("projectTitle")}</span>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {LINK_ITEMS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground">
        {t("copyright", { year: new Date().getFullYear() })}
      </p>
    </footer>
  )
}
