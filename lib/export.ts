import { getFontEmbedCSS, toBlob } from "html-to-image"

import type { CoverConfig } from "@/types/cover"

export const EXPORT_NODE_ID = "cover-export-node"

/** Le code est une clé du namespace `errors` : l'appelant traduit le message. */
export class ExportError extends Error {
  constructor(readonly code: "previewNotFound" | "captureRefused") {
    super(code)
  }
}

/** Seule la police du template est embarquée, et une seule fois par session. */
let fontCSS: Promise<string> | undefined

function templateFontCSS(node: HTMLElement) {
  fontCSS ??= getFontEmbedCSS(node).then((css) =>
    (css.match(/@font-face\s*{[^}]*}/g) ?? [])
      .filter((rule) => /font-family:\s*['"]?Poppins/i.test(rule))
      .join("\n")
  )
  return fontCSS
}

export function coverFilename(content: CoverConfig["content"], sizeId = "cover") {
  const base = `${content.nameMain}${content.nameAccent ?? ""}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "")
  return `${base || "cover"}-${sizeId}.png`
}

/**
 * Capture le canevas à sa taille native, puis le dessine aux dimensions du
 * format (`output` × `scale`). La prévisualisation applique son `scale()` sur
 * un parent : le nœud capturé n'est jamais transformé.
 */
export async function exportCover(
  canvas: { width: number; height: number },
  output: { width: number; height: number },
  filename: string,
  scale: 1 | 2 = 1
) {
  const node = document.getElementById(EXPORT_NODE_ID)
  if (!node) throw new ExportError("previewNotFound")

  await document.fonts.ready
  const fontEmbedCSS = await templateFontCSS(node)

  let blob: Blob | null
  try {
    blob = await toBlob(node, {
      ...canvas,
      canvasWidth: output.width * scale,
      canvasHeight: output.height * scale,
      pixelRatio: 1,
      fontEmbedCSS,
      cacheBust: false,
    })
  } catch {
    blob = null
  }
  if (!blob) throw new ExportError("captureRefused")

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
