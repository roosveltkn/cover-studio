"use client"

import { X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "@/i18n/provider"
import { pluralSuffix } from "@/i18n/translator"
import { trackTemplateSelected } from "@/lib/analytics"
import { TEMPLATE_TAGS, filterTemplates } from "@/lib/template-filter"
import { cn } from "@/lib/utils"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate, templates } from "@/templates/registry"
import type { PanelId, TemplateTag } from "@/types/cover"

import { ExportCard } from "./export-card"
import { FitPreview } from "./fit-preview"
import { SchemaField } from "./schema-field"

export type { PanelId }

export function Panel({ id }: { id: PanelId }) {
  const t = useTranslations("panels")
  const title = t(`${id}Title`)
  const description = t(`${id}Description`)
  const templateId = useCoverStore((state) => state.config.template)

  const header = (
    <header className="flex flex-col gap-1">
      <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  )

  // Le panneau des modèles gère son en-tête : il reste collé en haut au défilement.
  if (id === "templates") return <TemplatesPanel header={header} />

  return (
    <div className="flex flex-col gap-6 p-4">
      {header}
      {id === "export" ? (
        <ExportCard />
      ) : (
        <Rows>
          {getTemplate(templateId)
            .schema.filter((field) => field.section === id)
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

function TemplatesPanel({ header }: { header: ReactNode }) {
  const t = useTranslations("templates")
  const tPanel = useTranslations("templatesPanel")
  const tTags = useTranslations("templateTags")
  const locale = useLocale()
  const config = useCoverStore((state) => state.config)
  const setField = useCoverStore((state) => state.setField)
  const tags = useCoverStore((state) => state.templateTags)
  const setTags = useCoverStore((state) => state.setTemplateTags)
  const active = getTemplate(config.template).id
  const results = filterTemplates(templates, tags)

  function toggleTag(tag: TemplateTag) {
    setTags(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag])
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Titre, étiquettes et compteur restent visibles pendant le défilement. */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-4 border-b border-border/60 bg-background px-4 pt-4 pb-3">
        {header}
        <div role="group" aria-label={tPanel("tagsLabel")} className="flex flex-wrap gap-1.5">
          {TEMPLATE_TAGS.map((tag) => {
            const pressed = tags.includes(tag)
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
          {tags.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setTags([])}>
              <X data-icon="inline-start" />
              {tPanel("reset")}
            </Button>
          )}
        </div>
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
                    <span className="text-xs text-muted-foreground">
                      {t(template.descriptionKey)}
                    </span>
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
