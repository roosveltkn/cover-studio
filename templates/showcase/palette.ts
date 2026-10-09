import { converter, parse } from "culori"

import { clamp, contrast, hexToOklch, isHexColor, oklch, oklchToHex } from "@/lib/color"

export type ShowcasePalette = {
  base: string
  /** Voile noir radial depuis le coin haut-droite, en CSS. */
  shade: string
  halo: string
  nameAccent: string
  chipBg: string
  badgeBg: string
  badgeBorder: string
  /** Marque vive ou claire : les éléments d'accent passent en sombre. */
  vivid: boolean
}

/**
 * Opacité du voile noir selon la distance normalisée au coin haut-droite,
 * calibrée sur les covers de référence du gabarit.
 */
const SHADE_STOPS: [distance: number, alpha: number][] = [
  [0, 0],
  [0.5, 0.19],
  [0.74, 0.53],
  [0.95, 0.67],
  [1.3, 0.8],
]
/** Distance de la colonne de texte (pastille et nom) au coin haut-droite. */
const TEXT_DISTANCE = 0.9

const toRgb = converter("rgb")

/**
 * Dérive toute la palette du template à partir de la couleur de marque (SPECS §7).
 * Une marque vive reçoit un voile plus léger, puis le voile
 * est renforcé jusqu'à garantir un contraste AA du texte blanc sur la colonne.
 */
export function derivePalette(
  brandColor: string,
  accentOverride?: string
): ShowcasePalette {
  const brand = hexToOklch(brandColor)
  const { l, c, h } = brand
  const chroma = c ?? 0
  const hue = h ?? 0
  const vivid = l > 0.65

  // Une marque presque noire donnerait un fond uniforme : on remonte la base.
  const base = oklchToHex(l < 0.3 ? oklch(0.3, chroma, hue) : brand)

  let depth = clamp(1 - (l - 0.5) * 1.9, 0.6, 1)
  while (depth < 1.4 && contrast(shadeAt(base, TEXT_DISTANCE, depth), "#ffffff") < 4.5) {
    depth += 0.05
  }

  const halo = oklch(Math.min(l + 0.1, 0.92), chroma * 1.1, hue)
  const nameAccent = vivid
    ? oklch(0.22, chroma * 0.5, hue)
    : oklch(Math.max(Math.min(l + 0.22, 0.82), 0.72), chroma * 0.75, hue)

  return {
    base,
    shade: shadeGradient(depth),
    halo: oklchToHex(halo),
    nameAccent:
      accentOverride && isHexColor(accentOverride)
        ? accentOverride
        : oklchToHex(nameAccent),
    chipBg: vivid ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.08)",
    badgeBg: "rgba(255, 255, 255, 0.08)",
    badgeBorder: "rgba(255, 255, 255, 0.35)",
    vivid,
  }
}

/** Opacité du voile à une distance donnée ; `depth` < 1 éclaircit surtout le centre. */
function shadeAlpha(distance: number, depth: number) {
  const last = SHADE_STOPS[SHADE_STOPS.length - 1][0]
  let alpha = SHADE_STOPS[0][1]
  for (let i = 1; i < SHADE_STOPS.length; i++) {
    const [d0, a0] = SHADE_STOPS[i - 1]
    const [d1, a1] = SHADE_STOPS[i]
    if (distance <= d1) {
      alpha = a0 + ((a1 - a0) * (distance - d0)) / (d1 - d0)
      break
    }
    alpha = a1
  }
  const weight = depth + (1 - depth) * (distance / last) ** 3
  return clamp(alpha * weight, 0, 0.95)
}

function shadeGradient(depth: number) {
  const stops = SHADE_STOPS.map(
    ([distance]) =>
      `rgba(0, 0, 0, ${shadeAlpha(distance, depth).toFixed(3)}) ${distance * 100}%`
  )
  return `radial-gradient(ellipse 100% 100% at 100% 0%, ${stops.join(", ")})`
}

/** Couleur obtenue en sRGB sous le voile, comme le rendu CSS. */
function shadeAt(base: string, distance: number, depth: number) {
  const rgb = toRgb(parse(base)) ?? { r: 0, g: 0, b: 0 }
  const keep = 1 - shadeAlpha(distance, depth)
  const channel = (value: number) =>
    Math.round(clamp(value * keep, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`
}
