import { beforeEach, describe, expect, it, vi } from "vitest"

import { defaultConfig } from "@/templates/showcase/defaults"

import { landscape, portrait } from "./helpers"

const STORAGE_KEY = "cover-generator"

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

let storage: ReturnType<typeof memoryStorage>

/** Store neuf à chaque test : le module garde un singleton et un drapeau d'hydratation. */
async function loadStore() {
  vi.resetModules()
  return import("@/stores/cover-store")
}

beforeEach(() => {
  storage = memoryStorage()
  vi.stubGlobal("localStorage", storage)
})

describe("setField", () => {
  it("modifie un champ par chemin pointé sans toucher au reste", async () => {
    const { useCoverStore } = await loadStore()
    const before = useCoverStore.getState().config

    useCoverStore.getState().setField("content.badge", "Nouveau")

    const after = useCoverStore.getState().config
    expect(after.content.badge).toBe("Nouveau")
    expect(after.content.footer).toBe(before.content.footer)
    expect(after.style).toBe(before.style)
  })
})

describe("startFrom", () => {
  it("choisit le template mobile pour une capture portrait", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().startFrom([portrait()])
    expect(useCoverStore.getState().config.template).toBe("mobile-trio")
  })

  it("quitte le template mobile pour une capture paysage", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().startFrom([portrait()])
    useCoverStore.getState().startFrom([landscape()])
    expect(useCoverStore.getState().config.template).toBe("showcase")
  })

  it("garde le template choisi pour une capture paysage", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().setField("template", "bento")
    useCoverStore.getState().startFrom([landscape()])
    expect(useCoverStore.getState().config.template).toBe("bento")
  })

  it("reprend la couleur dominante comme couleur de marque, si elle existe", async () => {
    const { useCoverStore } = await loadStore()
    const initial = useCoverStore.getState().config.style.brandColor

    useCoverStore.getState().startFrom([landscape()])
    expect(useCoverStore.getState().config.style.brandColor).toBe(initial)

    useCoverStore.getState().startFrom([landscape({ dominant: "#16a34a" })])
    expect(useCoverStore.getState().config.style.brandColor).toBe("#16a34a")
  })

  it("remplace les captures par celles importées, dans l'ordre", async () => {
    const { useCoverStore } = await loadStore()
    const images = [landscape(), portrait()]
    useCoverStore.getState().startFrom(images)
    expect(useCoverStore.getState().config.mockups.images).toEqual(images)
  })

  it("ouvre le modèle choisi sur l'accueil, quelle que soit l'orientation", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().startFrom([portrait()], { template: "aurora" })
    expect(useCoverStore.getState().config.template).toBe("aurora")
  })

  it("garde un template navigateur dès qu'une capture est en paysage", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().startFrom([portrait(), landscape()])
    expect(useCoverStore.getState().config.template).toBe("showcase")
  })
})

describe("applyLocale", () => {
  it("traduit les textes d'exemple", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().applyLocale("fr")

    expect(useCoverStore.getState().locale).toBe("fr")
    expect(useCoverStore.getState().config.content).toEqual(defaultConfig("fr").content)
  })

  it("ne touche pas aux textes modifiés par l'utilisateur", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().setField("content.nameMain", "MonApp")
    useCoverStore.getState().applyLocale("fr")

    const { content } = useCoverStore.getState().config
    expect(content.nameMain).toBe("MonApp")
    expect(content.description).toBe(defaultConfig("fr").content.description)
  })

  it("garde la même référence de configuration quand rien ne change", async () => {
    const { useCoverStore } = await loadStore()
    const before = useCoverStore.getState().config
    useCoverStore.getState().applyLocale(useCoverStore.getState().locale)
    expect(useCoverStore.getState().config).toBe(before)
  })
})

describe("persistance", () => {
  it("n'enregistre ni les captures ni l'icône", async () => {
    const { useCoverStore } = await loadStore()
    useCoverStore.getState().startFrom([landscape()])
    useCoverStore.getState().setField("content.icon", landscape())
    useCoverStore.getState().setField("content.badge", "Sauvé")

    const saved = JSON.parse(storage.data.get(STORAGE_KEY) ?? "{}").state.config
    expect(saved.content.badge).toBe("Sauvé")
    expect(saved.content.icon).toBeUndefined()
    expect(saved.mockups.images).toEqual([])
  })

  it("recharge textes et couleurs sans écraser les captures en mémoire", async () => {
    storage.data.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        state: {
          config: {
            ...defaultConfig("en"),
            content: { ...defaultConfig("en").content, badge: "Sauvé" },
            style: { brandColor: "#ef4444" },
          },
        },
      })
    )
    const { useCoverStore, hydrateCoverStore } = await loadStore()
    const image = landscape()

    // Même ordre que l'accueil : hydratation, puis import de la capture.
    hydrateCoverStore()
    useCoverStore.getState().startFrom([image])

    const { config } = useCoverStore.getState()
    expect(config.content.badge).toBe("Sauvé")
    expect(config.style.brandColor).toBe("#ef4444")
    expect(config.mockups.images).toEqual([image])
  })

  it("abandonne une sauvegarde d'une ancienne version", async () => {
    storage.data.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          config: {
            ...defaultConfig("en"),
            content: { ...defaultConfig("en").content, badge: "Ancien" },
          },
        },
      })
    )
    const { useCoverStore, hydrateCoverStore } = await loadStore()

    hydrateCoverStore()

    expect(useCoverStore.getState().config.content.badge).toBe(defaultConfig("en").content.badge)
  })
})
