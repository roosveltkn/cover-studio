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
