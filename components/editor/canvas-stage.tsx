"use client"

import { useEffect, useRef, useState } from "react"

import { useCoverStore } from "@/stores/cover-store"
import { showcase } from "@/templates/registry"

import { CoverPreview } from "./cover-preview"

const PADDING = 24

export function CanvasStage() {
  const config = useCoverStore((state) => state.config)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const { width, height } = showcase.size
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setScale(
        Math.max(
          0.05,
          Math.min((box.width - PADDING * 2) / width, (box.height - PADDING * 2) / height)
        )
      )
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={stageRef}
      aria-label="Aperçu de la cover"
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[var(--stage)]"
    >
      {scale > 0 && (
        <div className="rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.12)]">
          <CoverPreview template={showcase} config={config} scale={scale} exportable />
        </div>
      )}
      <div className="absolute right-4 bottom-4 hidden rounded-full md:block bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground tabular-nums shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        Ajusté · {Math.round(scale * 100)} %
      </div>
    </section>
  )
}
