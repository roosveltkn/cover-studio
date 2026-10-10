import type { CoverConfig, ImageAsset, PlacedConfig, Slot, Template } from "@/types/cover"

/**
 * Plafond de la galerie : trois pages capturées en web et en mobile. Un modèle
 * n'affiche que ses emplacements ; les autres captures restent « non utilisées »
 * et se réordonnent pour changer celles qui s'affichent.
 */
export const MAX_IMAGES = 6

export function isPortrait(image: ImageAsset) {
  return image.height > image.width
}

/**
 * Pour chaque emplacement, l'index de la capture qui l'occupe (ou null).
 * Les captures sont parcourues dans l'ordre de la liste : une capture paysage
 * va au prochain emplacement navigateur, une capture portrait au prochain
 * téléphone. Si l'emplacement principal reste vide, il prend la première
 * capture restante, quelle que soit son orientation.
 */
export function assignSlots(images: ImageAsset[], slots: Slot[]) {
  const used = new Set<number>()
  const assigned = slots.map((slot) => {
    const index = images.findIndex(
      (image, i) => !used.has(i) && (isPortrait(image) ? "mobile" : "desktop") === slot.kind
    )
    if (index === -1) return null
    used.add(index)
    return index
  })

  if (assigned[0] === null) {
    const spare = images.findIndex((_, i) => !used.has(i))
    if (spare !== -1) assigned[0] = spare
  }
  return assigned
}

/** Clé du libellé de l'emplacement occupé par chaque capture (null si inutilisée). */
export function slotLabelKeys(images: ImageAsset[], slots: Slot[]) {
  const keys: (Slot["labelKey"] | null)[] = images.map(() => null)
  assignSlots(images, slots).forEach((index, slot) => {
    if (index !== null) keys[index] = slots[slot].labelKey
  })
  return keys
}

/** Place les captures dans les emplacements du template. */
export function placeImages(config: CoverConfig, template: Template): PlacedConfig {
  const { images } = config.mockups
  const placed: PlacedConfig["mockups"] = {
    ...config.mockups,
    showDesktop: false,
    showMobile: false,
  }

  if (images.length === 0) {
    // Aucun import : tous les emplacements en placeholder.
    placed.showDesktop = template.slots.some((slot) => slot.kind === "desktop")
    placed.showMobile = template.slots.some((slot) => slot.kind === "mobile")
    return { ...config, mockups: placed }
  }

  assignSlots(images, template.slots).forEach((index, i) => {
    if (index === null) return
    const slot = template.slots[i]
    placed[slot.key] = images[index]
    // Le type d'emplacement décide du cadre, même pour une capture de repli.
    if (slot.kind === "desktop") placed.showDesktop = true
    else placed.showMobile = true
  })
  return { ...config, mockups: placed }
}
