import type { ImageAsset } from "@/types/cover"

let counter = 0

/** Capture factice : seules les dimensions comptent pour la logique testée. */
export function makeImage(width: number, height: number, overrides: Partial<ImageAsset> = {}) {
  counter += 1
  return {
    id: `image-${counter}`,
    dataUrl: "data:image/png;base64,",
    width,
    height,
    name: `capture-${counter}.png`,
    luminance: 1,
    topColor: "#ffffff",
    ...overrides,
  } satisfies ImageAsset
}

export const landscape = (overrides?: Partial<ImageAsset>) => makeImage(1600, 900, overrides)
export const portrait = (overrides?: Partial<ImageAsset>) => makeImage(390, 844, overrides)
