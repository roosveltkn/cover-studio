"use client"

import type { ReactNode } from "react"

import { showcase } from "@/templates/registry"
import type { SectionId } from "@/types/cover"

import { ExportCard } from "./export-card"
import { SchemaField } from "./schema-field"

export type PanelId = SectionId

const TITLES: Record<PanelId, { title: string; description: string }> = {
  content: { title: "Texte", description: "Pastille, nom, description et fonctionnalités." },
  colors: { title: "Couleurs", description: "Une seule couleur : toute la palette en découle." },
  mockups: { title: "Captures", description: "Desktop, mobile, ou les deux. Rien n'est envoyé en ligne." },
  export: { title: "Télécharger", description: "Export PNG en taille réelle." },
}

export function Panel({ id }: { id: PanelId }) {
  const { title, description } = TITLES[id]

  return (
    <div className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {id === "export" ? (
        <ExportCard />
      ) : (
        <Rows>
          {showcase.schema
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
