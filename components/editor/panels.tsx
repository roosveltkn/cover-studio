"use client"

import type { ReactNode } from "react"

import { useTranslations } from "@/i18n/provider"
import { trackTemplateSelected } from "@/lib/analytics"
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
  const config = useCoverStore((state) => state.config)
  const setField = useCoverStore((state) => state.setField)
  const active = getTemplate(config.template).id

  return (
    // Une colonne dans le panneau desktop (350 px), deux en pleine largeur mobile.
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
      {templates.map((template) => {
        const selected = template.id === active
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              setField("template", template.id)
              if (!selected) trackTemplateSelected({ template: template.id })
            }}
            className="group flex flex-col gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
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
        )
      })}
    </div>
  )
}
