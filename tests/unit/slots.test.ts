import { describe, expect, it } from "vitest"

import { assignSlots, isPortrait, placeImages, slotLabelKeys } from "@/lib/slots"
import { defaultConfig } from "@/templates/showcase/defaults"
import type { Slot, Template } from "@/types/cover"

import { landscape, portrait } from "./helpers"

const BROWSER_AND_PHONE: Slot[] = [
  { kind: "desktop", labelKey: "browser", key: "desktopImage" },
  { kind: "mobile", labelKey: "phone", key: "mobileImage" },
]

const THREE_PHONES: Slot[] = [
  { kind: "mobile", labelKey: "phoneCenter", key: "mobileImage" },
  { kind: "mobile", labelKey: "phoneLeft", key: "mobileImage2" },
  { kind: "mobile", labelKey: "phoneRight", key: "mobileImage3" },
]

const template = (slots: Slot[]) => ({ slots }) as Template
const configWith = (images: ReturnType<typeof landscape>[]) => ({
  ...defaultConfig("fr"),
  mockups: { images, browserTheme: "auto" as const },
})

describe("isPortrait", () => {
  it("distingue portrait, paysage et carré", () => {
    expect(isPortrait(portrait())).toBe(true)
    expect(isPortrait(landscape())).toBe(false)
    expect(isPortrait({ ...landscape(), width: 500, height: 500 })).toBe(false)
  })
})

describe("assignSlots", () => {
  it("envoie le paysage au navigateur et le portrait au téléphone, quel que soit l'ordre", () => {
    expect(assignSlots([portrait(), landscape()], BROWSER_AND_PHONE)).toEqual([1, 0])
    expect(assignSlots([landscape(), portrait()], BROWSER_AND_PHONE)).toEqual([0, 1])
  })

  it("laisse vide un emplacement sans capture de la bonne orientation", () => {
    expect(assignSlots([landscape()], BROWSER_AND_PHONE)).toEqual([0, null])
  })

  it("remplit l'emplacement principal avec une capture de repli", () => {
    // Deux portraits pour un template navigateur + téléphone : le premier va au
    // téléphone, le second prend la place principale plutôt que de rester inutilisé.
    expect(assignSlots([portrait(), portrait()], BROWSER_AND_PHONE)).toEqual([1, 0])
  })

  it("n'utilise pas deux fois la même capture", () => {
    expect(assignSlots([portrait()], BROWSER_AND_PHONE)).toEqual([null, 0])
  })

  it("ignore les captures en trop", () => {
    const images = [landscape(), landscape(), portrait(), portrait()]
    expect(assignSlots(images, BROWSER_AND_PHONE)).toEqual([0, 2])
  })

  it("remplit trois téléphones dans l'ordre de la liste", () => {
    const images = [portrait(), portrait(), portrait()]
    expect(assignSlots(images, THREE_PHONES)).toEqual([0, 1, 2])
  })

  it("renvoie des emplacements vides sans capture", () => {
    expect(assignSlots([], BROWSER_AND_PHONE)).toEqual([null, null])
  })
})

describe("slotLabelKeys", () => {
  it("étiquette chaque capture par son emplacement, null si inutilisée", () => {
    const images = [portrait(), landscape(), landscape()]
    expect(slotLabelKeys(images, BROWSER_AND_PHONE)).toEqual(["phone", "browser", null])
  })
})

describe("placeImages", () => {
  it("affiche des placeholders pour tous les emplacements sans capture", () => {
    const placed = placeImages(configWith([]), template(BROWSER_AND_PHONE))
    expect(placed.mockups.showDesktop).toBe(true)
    expect(placed.mockups.showMobile).toBe(true)
    expect(placed.mockups.desktopImage).toBeUndefined()
  })

  it("ne montre pas de placeholder pour un type d'emplacement absent du template", () => {
    const placed = placeImages(configWith([]), template(THREE_PHONES))
    expect(placed.mockups.showDesktop).toBe(false)
    expect(placed.mockups.showMobile).toBe(true)
  })

  it("place chaque capture dans le champ de son emplacement", () => {
    const desktop = landscape()
    const phone = portrait()
    const placed = placeImages(configWith([phone, desktop]), template(BROWSER_AND_PHONE))

    expect(placed.mockups.desktopImage).toBe(desktop)
    expect(placed.mockups.mobileImage).toBe(phone)
    expect(placed.mockups.showDesktop).toBe(true)
    expect(placed.mockups.showMobile).toBe(true)
  })

  it("masque le mockup dont l'emplacement n'a pas de capture", () => {
    const placed = placeImages(configWith([landscape()]), template(BROWSER_AND_PHONE))
    expect(placed.mockups.showDesktop).toBe(true)
    expect(placed.mockups.showMobile).toBe(false)
  })

  it("garde le cadre de l'emplacement pour une capture de repli", () => {
    const [first, spare] = [portrait(), portrait()]
    const placed = placeImages(configWith([first, spare]), template(BROWSER_AND_PHONE))
    // Capture portrait de repli dans l'emplacement navigateur : cadre navigateur.
    expect(placed.mockups.mobileImage).toBe(first)
    expect(placed.mockups.desktopImage).toBe(spare)
    expect(placed.mockups.showDesktop).toBe(true)
  })

  it("ne modifie pas la configuration d'origine", () => {
    const config = configWith([landscape()])
    placeImages(config, template(BROWSER_AND_PHONE))
    expect("desktopImage" in config.mockups).toBe(false)
  })
})
