"use client"

import { useState } from "react"
import { toast } from "sonner"

import { coverFilename, exportCover } from "@/lib/export"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

export function useExport() {
  const config = useCoverStore((state) => state.config)
  const [exporting, setExporting] = useState(false)
  const filename = coverFilename(config.content)
  const { size } = getTemplate(config.template)

  async function run() {
    setExporting(true)
    const started = performance.now()
    try {
      await exportCover(size, filename, config.export.scale)
      const seconds = ((performance.now() - started) / 1000).toFixed(1)
      toast.success("Cover téléchargée", { description: `${filename} · ${seconds} s` })
    } catch (error) {
      toast.error("Export impossible", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setExporting(false)
    }
  }

  return { run, exporting, filename, size }
}
