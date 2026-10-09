import { describe, expect, it } from "vitest"

import { coverFilename } from "@/lib/export"
import { EXPORT_SIZES, canvasFor, getExportSize } from "@/lib/export-sizes"
import { defaultConfig } from "@/templates/showcase/defaults"

const content = (nameMain: string, nameAccent?: string) => ({
  ...defaultConfig("en").content,
  nameMain,
  nameAccent,
})

describe("coverFilename", () => {
  it("assemble nom et accent en minuscules, sans espaces", () => {
    expect(coverFilename(content("Cover", "Studio"))).toBe("coverstudio-cover.png")
  })

  it("retire les accents et caractères spéciaux", () => {
    expect(coverFilename(content("Café Été!", "#1"))).toBe("cafeete1-cover.png")
  })

  it("retombe sur « cover » quand rien d'exploitable ne reste", () => {
    expect(coverFilename(content("★★★"))).toBe("cover-cover.png")
  })

  it("ajoute l'identifiant du format", () => {
    expect(coverFilename(content("App"), "og")).toBe("app-og.png")
  })
})

describe("getExportSize", () => {
  it("renvoie le format demandé ou celui par défaut", () => {
    expect(getExportSize("og")).toMatchObject({ width: 1200, height: 630 })
    expect(getExportSize("inconnu")).toBe(EXPORT_SIZES[0])
    expect(getExportSize(undefined)).toBe(EXPORT_SIZES[0])
  })

  it("a des identifiants uniques", () => {
    const ids = EXPORT_SIZES.map((size) => size.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("canvasFor", () => {
  const design = { width: 2400, height: 1500 }

  it("garde le design intact quand le ratio est identique", () => {
    expect(canvasFor(design, EXPORT_SIZES[0])).toEqual(design)
  })

  it("élargit le canevas pour un format plus large, sans rogner", () => {
    const wide = { ...EXPORT_SIZES[0], width: 2000, height: 500 }
    expect(canvasFor(design, wide)).toEqual({ width: 6000, height: 1500 })
  })

  it("allonge le canevas pour un format plus haut", () => {
    expect(canvasFor(design, getExportSize("square"))).toEqual({ width: 2400, height: 2400 })
  })

  it("respecte toujours le ratio du format cible, sans jamais rogner le design", () => {
    for (const size of EXPORT_SIZES) {
      const canvas = canvasFor(design, size)
      expect(canvas.width / canvas.height).toBeCloseTo(size.width / size.height, 2)
      expect(canvas.width).toBeGreaterThanOrEqual(design.width)
      expect(canvas.height).toBeGreaterThanOrEqual(design.height)
    }
  })
})
