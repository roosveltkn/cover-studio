"use client"

import { useEffect, useRef, useState } from "react"

import type { CoverConfig, Template } from "@/types/cover"

import { CoverPreview, coverCanvas } from "./cover-preview"

/** Aperçu qui occupe toute la largeur de son conteneur, aux proportions du format. */
export function FitPreview({ template, config }: { template: Template; config: CoverConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const canvas = coverCanvas(template, config)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="w-full"
      style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
    >
      {width > 0 && (
        <CoverPreview template={template} config={config} scale={width / canvas.width} />
      )}
    </div>
  )
}
