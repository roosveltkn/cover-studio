"use client"

import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useExport } from "./use-export"

export function ExportCard() {
  const { run, exporting, filename, size } = useExport()

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted p-3 text-sm">
        <dt className="text-muted-foreground">Format</dt>
        <dd className="font-medium">PNG</dd>
        <dt className="text-muted-foreground">Taille</dt>
        <dd className="font-medium tabular-nums">
          {size.width} × {size.height} px
        </dd>
        <dt className="text-muted-foreground">Fichier</dt>
        <dd className="truncate font-medium" title={filename}>
          {filename}
        </dd>
      </dl>
      <Button size="lg" className="h-10 w-full" onClick={run} disabled={exporting}>
        {exporting ? <Loader2 className="animate-spin" /> : <Download />}
        {exporting ? "Génération…" : "Télécharger le PNG"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Tout est généré dans votre navigateur : aucune image n&apos;est envoyée à un serveur.
      </p>
    </div>
  )
}
