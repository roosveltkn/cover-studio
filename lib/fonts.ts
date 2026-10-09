import type { TextElement } from "@/types/cover"

/** Polices proposées : chargées dans le layout via next/font, embarquées à l'export. */
export const FONTS = [
  { id: "poppins", label: "Poppins", family: "Poppins", cssVar: "--font-poppins" },
  { id: "inter", label: "Inter", family: "Inter", cssVar: "--font-sans" },
  { id: "montserrat", label: "Montserrat", family: "Montserrat", cssVar: "--font-montserrat" },
  { id: "space-grotesk", label: "Space Grotesk", family: "Space Grotesk", cssVar: "--font-space-grotesk" },
  { id: "playfair", label: "Playfair Display", family: "Playfair Display", cssVar: "--font-playfair" },
  { id: "geist-mono", label: "Geist Mono", family: "Geist Mono", cssVar: "--font-mono" },
] as const

export const DEFAULT_FONT = "poppins"

export function getFont(id: string | undefined) {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]
}

export function fontStack(id: string | undefined) {
  return `var(${getFont(id).cssVar}), sans-serif`
}

export const TEXT_ELEMENTS: TextElement[] = ["badge", "name", "description", "chips", "footer"]

export const SCALE_MIN = 0.6
export const SCALE_MAX = 1.6
export const SCALE_STEP = 0.05
