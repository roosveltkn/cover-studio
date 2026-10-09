"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useLocale, useTranslations } from "@/i18n/provider"
import { ExportError, coverFilename, exportCover } from "@/lib/export"
import { getExportSize } from "@/lib/export-sizes"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

import { coverCanvas } from "./cover-preview"

export function useExport() {
  const t = useTranslations("export")
  const tErrors = useTranslations("errors")
  const locale = useLocale()
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
      await exportCover(canvas, output, filename, scale, config.style.fontFamily)
      const seconds = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format((performance.now() - started) / 1000)
      toast.success(t("toastSuccess"), {
        description: t("toastSuccessDescription", { filename, seconds }),
      })
    } catch (error) {
      toast.error(t("toastError"), {
        description:
          error instanceof ExportError
            ? tErrors(error.code)
            : error instanceof Error
              ? error.message
              : undefined,
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
