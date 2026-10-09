export type ExportSize = {
  id: string
  label: string
  /** Usage typique, affiché sous le libellé. */
  hint: string
  width: number
  height: number
}

export const EXPORT_SIZES: ExportSize[] = [
  { id: "cover", label: "Cover", hint: "Portfolio, README", width: 2400, height: 1500 },
  { id: "og", label: "Open Graph", hint: "Liens partagés, LinkedIn", width: 1200, height: 630 },
  { id: "github", label: "GitHub", hint: "Aperçu social du dépôt", width: 1280, height: 640 },
  { id: "x", label: "X / Twitter", hint: "Image de post 16:9", width: 1600, height: 900 },
  { id: "product-hunt", label: "Product Hunt", hint: "Galerie", width: 1270, height: 760 },
  { id: "square", label: "Carré", hint: "Instagram, LinkedIn", width: 1080, height: 1080 },
]

export function getExportSize(id: string | undefined) {
  return EXPORT_SIZES.find((size) => size.id === id) ?? EXPORT_SIZES[0]
}

/**
 * Canevas de rendu pour un format : le design du template garde sa taille
 * native et le canevas s'élargit (ou s'allonge) pour atteindre le ratio du
 * format. Le fond du template remplit les bandes ajoutées, rien n'est rogné.
 */
export function canvasFor(design: { width: number; height: number }, target: ExportSize) {
  const ratio = target.width / target.height
  const designRatio = design.width / design.height
  return ratio >= designRatio
    ? { width: Math.round(design.height * ratio), height: design.height }
    : { width: design.width, height: Math.round(design.width / ratio) }
}
