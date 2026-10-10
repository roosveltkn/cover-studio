import { describe, expect, it } from "vitest"

import { isOriginAllowed } from "../lib/cors.js"

describe("isOriginAllowed", () => {
  const allowed =
    "https://cover.studio, https://cover-studio-*.vercel.app, http://localhost:3000"

  it("accepte tout quand la liste est vide (développement)", () => {
    expect(isOriginAllowed("https://ailleurs.com", "")).toBe(true)
  })

  it("accepte les origines listées", () => {
    expect(isOriginAllowed("https://cover.studio", allowed)).toBe(true)
    expect(isOriginAllowed("http://localhost:3000", allowed)).toBe(true)
  })

  it("accepte un sous-domaine qui correspond au joker", () => {
    expect(
      isOriginAllowed("https://cover-studio-git-feat-abc.vercel.app", allowed)
    ).toBe(true)
  })

  it("refuse les autres origines", () => {
    expect(isOriginAllowed("https://ailleurs.com", allowed)).toBe(false)
    expect(isOriginAllowed("https://cover.studio.evil.com", allowed)).toBe(
      false
    )
    expect(isOriginAllowed("https://coverxstudio", allowed)).toBe(false)
    expect(
      isOriginAllowed("https://cover-studio-a.b.vercel.app", allowed)
    ).toBe(false)
    expect(isOriginAllowed("http://localhost:3001", allowed)).toBe(false)
  })

  it("laisse passer les requêtes sans Origin (hors navigateur)", () => {
    expect(isOriginAllowed(null, allowed)).toBe(true)
  })
})
