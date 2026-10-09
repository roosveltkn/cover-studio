import type { MessageKey } from "@/i18n/translator"

export type ExportSize = {
  id: string
  /** Clé du libellé dans le namespace `exportSizes`. */
  labelKey: MessageKey<"exportSizes">
  /** Usage typique, affiché sous le libellé. */
  hintKey: MessageKey<"exportSizes">
  width: number
  height: number
}

export const EXPORT_SIZES: ExportSize[] = [
  { id: "cover", labelKey: "coverLabel", hintKey: "coverHint", width: 2400, height: 1500 },
  { id: "og", labelKey: "ogLabel", hintKey: "ogHint", width: 1200, height: 630 },
  { id: "github", labelKey: "githubLabel", hintKey: "githubHint", width: 1280, height: 640 },
  { id: "x", labelKey: "xLabel", hintKey: "xHint", width: 1600, height: 900 },
  {
    id: "product-hunt",
    labelKey: "productHuntLabel",
    hintKey: "productHuntHint",
    width: 1270,
    height: 760,
  },
  { id: "square", labelKey: "squareLabel", hintKey: "squareHint", width: 1080, height: 1080 },
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
