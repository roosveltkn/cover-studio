import { clamp } from "@/lib/color"
import type { ImageAsset, PlacedMockups } from "@/types/cover"

export const COVER_SIZE = { width: 2400, height: 1500 }

/** Thème du navigateur : choix explicite, sinon déduit de la luminosité de la capture. */
export function resolveBrowserTheme(mockups: PlacedMockups) {
  if (mockups.browserTheme && mockups.browserTheme !== "auto") return mockups.browserTheme
  return mockups.desktopImage && mockups.desktopImage.luminance < 0.4 ? "dark" : "light"
}

/** Hauteur de la zone de contenu : suit le ratio de la capture, bornée. */
export function browserContentHeight(
  image: ImageAsset | undefined,
  width: number,
  bounds: { min: number; max: number; empty: number }
) {
  if (!image) return bounds.empty
  return clamp(Math.round((width * image.height) / image.width), bounds.min, bounds.max)
}

/** Grille fine en fond, en dégradés CSS (pas de SVG, cf. Safari). */
export function gridLayers(color: string) {
  return [
    `linear-gradient(${color} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${color} 1px, transparent 1px)`,
  ]
}

/**
 * Les trois écrans de téléphone d'un template mobile. Sans 2e et 3e capture,
 * on montre d'autres cadrages de la capture principale.
 */
export function phoneScreens(mockups: PlacedMockups) {
  const main = mockups.mobileImage
  return [
    { image: main, position: "top" },
    { image: mockups.mobileImage2 ?? main, position: mockups.mobileImage2 ? "top" : "50%" },
    { image: mockups.mobileImage3 ?? main, position: mockups.mobileImage3 ? "top" : "100%" },
  ]
}
