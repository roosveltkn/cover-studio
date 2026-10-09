import { describe, expect, it } from "vitest"

import {
  clamp,
  contrast,
  hexAlpha,
  hexToOklch,
  isHexColor,
  oklchToHex,
  readableOn,
  tone,
} from "@/lib/color"
import { COLOR_PRESETS } from "@/templates/showcase/defaults"

describe("isHexColor", () => {
  it("accepte #rgb et #rrggbb", () => {
    expect(isHexColor("#fff")).toBe(true)
    expect(isHexColor("#7D2AE8")).toBe(true)
  })

  it("refuse le reste", () => {
    for (const value of ["", "fff", "#ffff", "#gggggg", "rgb(0,0,0)", "#12345"]) {
      expect(isHexColor(value)).toBe(false)
    }
  })
})

describe("hexToOklch / oklchToHex", () => {
  it("fait l'aller-retour sur une couleur de marque", () => {
    expect(oklchToHex(hexToOklch("#7d2ae8"))).toBe("#7d2ae8")
  })

  it("retombe sur une couleur de secours pour un hex invalide", () => {
    const color = hexToOklch("pas-une-couleur")
    expect(color.l).toBeGreaterThan(0)
    expect(color.l).toBeLessThan(1)
  })

  it("garde noir et blanc aux extrêmes de luminosité", () => {
    expect(hexToOklch("#000000").l).toBeCloseTo(0, 2)
    expect(hexToOklch("#ffffff").l).toBeCloseTo(1, 2)
  })

  it("ramène une couleur hors gamut sRGB en hex valide", () => {
    const hex = oklchToHex({ mode: "oklch", l: 0.7, c: 0.6, h: 150 })
    expect(isHexColor(hex)).toBe(true)
  })
})

describe("clamp / hexAlpha", () => {
  it("borne une valeur", () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })

  it("ajoute l'opacité en hexadécimal, bornée entre 0 et 1", () => {
    expect(hexAlpha("#112233", 1)).toBe("#112233ff")
    expect(hexAlpha("#112233", 0)).toBe("#11223300")
    expect(hexAlpha("#112233", 0.5)).toBe("#11223380")
    expect(hexAlpha("#112233", 3)).toBe("#112233ff")
  })
})

describe("readableOn", () => {
  const RATIO = 4.5

  it("renvoie la couleur telle quelle quand le contraste suffit", () => {
    expect(readableOn("#000000", "#ffffff")).toBe("#000000")
  })

  it("assombrit une couleur trop claire sur fond clair", () => {
    expect(contrast(readableOn("#facc15", "#ffffff"), "#ffffff")).toBeGreaterThanOrEqual(RATIO)
  })

  it("éclaircit une couleur trop sombre sur fond sombre", () => {
    expect(contrast(readableOn("#1e1b4b", "#0a0a0a"), "#0a0a0a")).toBeGreaterThanOrEqual(RATIO)
  })

  it("rend lisibles toutes les couleurs proposées, sur fond clair comme sombre", () => {
    for (const preset of COLOR_PRESETS) {
      for (const background of ["#ffffff", "#0b0b10"]) {
        expect(contrast(readableOn(preset, background), background)).toBeGreaterThanOrEqual(RATIO)
      }
    }
  })
})

describe("tone", () => {
  it("garde la teinte et applique la luminosité demandée", () => {
    const result = hexToOklch(tone("#7d2ae8", 0.9))
    expect(result.l).toBeCloseTo(0.9, 1)
    expect(Math.abs((result.h ?? 0) - (hexToOklch("#7d2ae8").h ?? 0))).toBeLessThan(10)
  })

  it("désature quand l'échelle de chroma est nulle", () => {
    expect(hexToOklch(tone("#7d2ae8", 0.5, 0)).c).toBeLessThan(0.01)
  })
})
