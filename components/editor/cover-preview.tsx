import { EXPORT_NODE_ID } from "@/lib/export"
import { canvasFor, getExportSize } from "@/lib/export-sizes"
import { placeImages } from "@/lib/slots"
import { EditingContext, type EditingApi } from "@/templates/shared/editable"
import { CanvasContext, TypographyContext } from "@/templates/shared/text-block"
import type { CoverConfig, Template } from "@/types/cover"

type CoverPreviewProps = {
  template: Template
  config: CoverConfig
  scale: number
  /** Seul l'aperçu principal porte l'id capturé à l'export. */
  exportable?: boolean
  /** Édition directe des textes : aperçu principal uniquement. */
  editing?: EditingApi
  children?: React.ReactNode
}

/** Canevas du template au format d'export choisi. */
export function coverCanvas(template: Template, config: CoverConfig) {
  return canvasFor(template.size, getExportSize(config.export.size))
}

/** Rend le template à taille native et le réduit via un parent transformé. */
export function CoverPreview({
  template,
  config,
  scale,
  exportable,
  editing,
  children,
}: CoverPreviewProps) {
  const canvas = coverCanvas(template, config)
  const Component = template.component

  return (
    <div
      className="relative shrink-0"
      style={{ width: canvas.width * scale, height: canvas.height * scale }}
    >
      <div
        style={{
          ...canvas,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          ["--edit-scale" as string]: scale,
        }}
      >
        <div id={exportable ? EXPORT_NODE_ID : undefined} style={canvas}>
          <CanvasContext value={canvas}>
            <TypographyContext value={config.style}>
              <EditingContext value={editing ?? null}>
                <Component config={placeImages(config, template)} />
              </EditingContext>
            </TypographyContext>
          </CanvasContext>
        </div>
      </div>
      {children}
    </div>
  )
}
