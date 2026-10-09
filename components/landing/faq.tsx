"use client"

import { ChevronDown } from "lucide-react"

import { useTranslations } from "@/i18n/provider"

import { FAQ_ITEMS } from "./faq-items"

/**
 * Questions fréquentes en `<details>` natifs : accessibles au clavier, sans JavaScript,
 * et leur texte reste dans le HTML pour les moteurs de recherche.
 */
export function Faq() {
  const t = useTranslations("faq")

  return (
    <section aria-labelledby="faq-title" className="flex flex-col gap-5">
      <h2 id="faq-title" className="text-xl font-semibold tracking-tight">
        {t("title")}
      </h2>
      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-2xl bg-background px-5 ring-1 ring-foreground/5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              {t(question)}
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-4 text-sm text-muted-foreground">{t(answer)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
