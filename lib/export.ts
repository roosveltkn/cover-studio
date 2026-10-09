import { getFontEmbedCSS, toBlob } from "html-to-image"

import type { CoverConfig } from "@/types/cover"

export const EXPORT_NODE_ID = "cover-export-node"

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

export function coverFilename(content: CoverConfig["content"]) {
  const base = `${content.nameMain}${content.nameAccent ?? ""}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "")
  return `${base || "cover"}-cover.png`
}

/**
 * Capture le template à sa taille native. La prévisualisation applique son
 * `scale()` sur un parent : le nœud capturé n'est jamais transformé.
 */
export async function exportCover(
  size: { width: number; height: number },
  filename: string,
  scale: 1 | 2 = 1
) {
  const node = document.getElementById(EXPORT_NODE_ID)
  if (!node) throw new Error("Aperçu introuvable.")

  await document.fonts.ready
  const fontEmbedCSS = await templateFontCSS(node)

  let blob: Blob | null
  try {
    blob = await toBlob(node, {
      ...size,
      pixelRatio: scale,
      fontEmbedCSS,
      cacheBust: false,
    })
  } catch {
    blob = null
  }
  if (!blob) {
    throw new Error(
      "Le navigateur a refusé la capture (mémoire insuffisante ?). Essayez sur un ordinateur."
    )
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
