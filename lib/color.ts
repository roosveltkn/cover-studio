import {
  clampChroma,
  converter,
  formatHex,
  parse,
  wcagContrast,
  type Oklch,
} from "culori"

const toOklch = converter("oklch")

const FALLBACK: Oklch = { mode: "oklch", l: 0.55, c: 0.2, h: 285 }

export function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

/** Couleur CSS calculée ("rgb(…)") en hex, noir si illisible. */
export function cssToHex(color: string) {
  const parsed = parse(color)
  return (parsed && formatHex(parsed)) ?? "#000000"
}

export function hexToOklch(hex: string): Oklch {
  const parsed = parse(hex)
  const color = parsed ? toOklch(parsed) : undefined
  if (!color) return FALLBACK
  return { mode: "oklch", l: color.l, c: color.c ?? 0, h: color.h ?? 0 }
}

/** Ramène la couleur dans le gamut sRGB et la formate en hex. */
export function oklchToHex(color: Oklch) {
  return formatHex(clampChroma(color, "oklch")) ?? "#000000"
}

export function oklch(l: number, c: number, h: number): Oklch {
  return { mode: "oklch", l: clamp(l, 0, 1), c: Math.max(0, c), h }
}

export function contrast(a: string, b: string) {
  return wcagContrast(a, b)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Ajoute une opacité à une couleur hex (#rrggbb → #rrggbbaa). */
export function hexAlpha(hex: string, alpha: number) {
  const value = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${value}`
}

/**
 * Fait varier la luminosité d'une couleur, sans toucher sa teinte, jusqu'à
 * atteindre le ratio de contraste voulu face à `background`.
 */
export function readableOn(color: string, background: string, ratio = 4.5) {
  const base = hexToOklch(color)
  if (contrast(color, background) >= ratio) return color
  const towardDark = hexToOklch(background).l > 0.5
  let current = base
  for (let i = 0; i < 50 && contrast(oklchToHex(current), background) < ratio; i++) {
    current = oklch(current.l + (towardDark ? -0.02 : 0.02), current.c ?? 0, current.h ?? 0)
  }
  return oklchToHex(current)
}

/** Même teinte que `color`, à la luminosité et la saturation données. */
export function tone(color: string, l: number, chromaScale = 1) {
  const { c, h } = hexToOklch(color)
  return oklchToHex(oklch(l, (c ?? 0) * chromaScale, h ?? 0))
}
