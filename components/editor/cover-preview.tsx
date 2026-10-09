import { EXPORT_NODE_ID } from "@/lib/export"
import type { CoverConfig, Template } from "@/types/cover"

type CoverPreviewProps = {
  template: Template
  config: CoverConfig
  scale: number
  /** Seul l'aperçu principal porte l'id capturé à l'export. */
  exportable?: boolean
  children?: React.ReactNode
}

/** Rend le template à taille native et le réduit via un parent transformé. */
export function CoverPreview({
  template,
  config,
  scale,
  exportable,
  children,
}: CoverPreviewProps) {
  const { width, height } = template.size
  const Component = template.component

  return (
    <div className="relative shrink-0" style={{ width: width * scale, height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div id={exportable ? EXPORT_NODE_ID : undefined} style={{ width, height }}>
          <Component config={config} />
        </div>
      </div>
      {children}
    </div>
  )
}
