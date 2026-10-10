"use client"

import { Search, X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocale, useTranslations } from "@/i18n/provider"
import { pluralSuffix } from "@/i18n/translator"
import { trackTemplateSelected } from "@/lib/analytics"
import { EMPTY_FILTER, TEMPLATE_TAGS, filterTemplates, isFilterActive } from "@/lib/template-filter"
import { cn } from "@/lib/utils"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate, templates } from "@/templates/registry"
import type { PanelId } from "@/types/cover"

import { ExportCard } from "./export-card"
import { FitPreview } from "./fit-preview"
import { SchemaField } from "./schema-field"

export type { PanelId }

export function Panel({ id }: { id: PanelId }) {
  const t = useTranslations("panels")
  const title = t(`${id}Title`)
  const description = t(`${id}Description`)
  const templateId = useCoverStore((state) => state.config.template)

  return (
    <div className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {id === "templates" ? (
        <TemplatesPanel />
      ) : id === "export" ? (
        <ExportCard />
      ) : (
        <Rows>
          {getTemplate(templateId).schema
            .filter((field) => field.section === id)
            .map((field) => (
              <SchemaField key={field.path} field={field} />
            ))}
        </Rows>
      )}
    </div>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

function TemplatesPanel() {
  const t = useTranslations("templates")
  const tPanel = useTranslations("templatesPanel")
  const tTags = useTranslations("templateTags")
  const locale = useLocale()
  const config = useCoverStore((state) => state.config)
  const setField = useCoverStore((state) => state.setField)
  const filter = useCoverStore((state) => state.templateFilter)
  const setFilter = useCoverStore((state) => state.setTemplateFilter)
  const active = getTemplate(config.template).id

  // La recherche porte sur les textes affichés, dans la langue de la page.
  const results = filterTemplates(templates, filter, (template) => [
    t(template.nameKey),
    t(template.descriptionKey),
    ...template.tags.map((tag) => tTags(tag)),
  ])

  function toggleTag(tag: (typeof TEMPLATE_TAGS)[number]) {
    const tags = filter.tags.includes(tag)
      ? filter.tags.filter((item) => item !== tag)
      : [...filter.tags, tag]
    setFilter({ ...filter, tags })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={filter.query}
          onChange={(event) => setFilter({ ...filter, query: event.target.value })}
          aria-label={tPanel("searchLabel")}
          placeholder={tPanel("searchPlaceholder")}
          className="h-9 pl-8"
        />
      </div>

      <div role="group" aria-label={tPanel("tagsLabel")} className="flex flex-wrap gap-1.5">
        {TEMPLATE_TAGS.map((tag) => {
          const pressed = filter.tags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggleTag(tag)}
              className={cn(
                "h-7 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                pressed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tTags(tag)}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-7 items-center justify-between gap-2">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {tPanel(`results${pluralSuffix(locale, results.length)}`, { count: results.length })}
        </p>
        {isFilterActive(filter) && (
          <Button variant="ghost" size="sm" onClick={() => setFilter(EMPTY_FILTER)}>
            <X data-icon="inline-start" />
            {tPanel("reset")}
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tPanel("empty")}
        </p>
      ) : (
        // Une colonne dans le panneau desktop (350 px), deux en pleine largeur mobile.
        <ul aria-label={tPanel("listLabel")} className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
          {results.map((template) => {
            const selected = template.id === active
            return (
              <li key={template.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setField("template", template.id)
                    if (!selected) trackTemplateSelected({ template: template.id })
                  }}
                  className="group flex w-full flex-col gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                >
                  <span
                    className={
                      "block w-full overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-shadow group-hover:shadow-md " +
                      (selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "")
                    }
                  >
                    <FitPreview template={template} config={{ ...config, template: template.id }} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{t(template.nameKey)}</span>
                    <span className="text-xs text-muted-foreground">{t(template.descriptionKey)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
