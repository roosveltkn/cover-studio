"use client"

import { useState } from "react"
import { toast } from "sonner"

import { coverFilename, exportCover } from "@/lib/export"
import { getExportSize } from "@/lib/export-sizes"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

import { coverCanvas } from "./cover-preview"

export function useExport() {
  const config = useCoverStore((state) => state.config)
  const [exporting, setExporting] = useState(false)
  const output = getExportSize(config.export.size)
  const scale = config.export.scale
  const filename = coverFilename(config.content, output.id)
  const canvas = coverCanvas(getTemplate(config.template), config)

  async function run() {
    setExporting(true)
    const started = performance.now()
    try {
      await exportCover(canvas, output, filename, scale)
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

  return {
    run,
    exporting,
    filename,
    output,
    scale,
    pixels: { width: output.width * scale, height: output.height * scale },
  }
}
