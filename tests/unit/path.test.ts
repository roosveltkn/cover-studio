import { describe, expect, it } from "vitest"

import { getPath, setPath } from "@/lib/path"

describe("getPath", () => {
  const source = { content: { badge: "Nouveau", chips: ["a", "b"] }, empty: null }

  it("lit une valeur imbriquée", () => {
    expect(getPath(source, "content.badge")).toBe("Nouveau")
    expect(getPath(source, "content.chips")).toEqual(["a", "b"])
  })

  it("renvoie undefined pour un chemin inexistant ou traversant une valeur nulle", () => {
    expect(getPath(source, "content.absent")).toBeUndefined()
    expect(getPath(source, "absent.profond")).toBeUndefined()
    expect(getPath(source, "empty.valeur")).toBeUndefined()
    expect(getPath(undefined, "a.b")).toBeUndefined()
  })
})

describe("setPath", () => {
  it("remplace une valeur sans muter la source", () => {
    const source = { content: { badge: "A", footer: "F" }, style: { brandColor: "#000000" } }
    const next = setPath(source, "content.badge", "B")

    expect(next.content.badge).toBe("B")
    expect(source.content.badge).toBe("A")
  })

  it("conserve les champs voisins et partage les branches intactes", () => {
    const source = { content: { badge: "A", footer: "F" }, style: { brandColor: "#000000" } }
    const next = setPath(source, "content.badge", "B")

    expect(next.content.footer).toBe("F")
    expect(next.style).toBe(source.style)
  })

  it("crée les niveaux manquants", () => {
    expect(setPath({}, "a.b.c", 1)).toEqual({ a: { b: { c: 1 } } })
    expect(setPath(undefined, "a", 1)).toEqual({ a: 1 })
  })
})
