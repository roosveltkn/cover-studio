"use client"

import { useEffect, useRef, useState } from "react"

import { getExportSize } from "@/lib/export-sizes"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

import { CoverPreview, coverCanvas } from "./cover-preview"

const PADDING = 24

export function CanvasStage() {
  const config = useCoverStore((state) => state.config)
  const stageRef = useRef<HTMLDivElement>(null)
  const template = getTemplate(config.template)
  const canvas = coverCanvas(template, config)
  const output = getExportSize(config.export.size)
  const [box, setBox] = useState<{ width: number; height: number }>()

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox({ width, height })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const scale = box
    ? Math.max(
        0.05,
        Math.min(
          (box.width - PADDING * 2) / canvas.width,
          (box.height - PADDING * 2) / canvas.height
        )
      )
    : 0

  return (
    <section
      ref={stageRef}
      aria-label="Aperçu de la cover"
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[var(--stage)]"
    >
      {scale > 0 && (
        <div className="rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.12)]">
          <CoverPreview template={template} config={config} scale={scale} exportable />
        </div>
      )}
      <div className="absolute right-4 bottom-4 hidden rounded-full md:block bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground tabular-nums shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        {output.label} · {output.width} × {output.height} ·{" "}
        {Math.round(((scale * canvas.width) / output.width) * 100)} %
      </div>
    </section>
  )
}
