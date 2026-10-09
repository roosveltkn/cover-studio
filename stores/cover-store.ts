import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { setPath } from "@/lib/path"
import { isPortrait } from "@/lib/slots"
import { DEFAULT_CONFIG } from "@/templates/showcase/defaults"
import type { CoverConfig, ImageAsset } from "@/types/cover"

type CoverState = {
  config: CoverConfig
  setField: (path: string, value: unknown) => void
  startFrom: (image: ImageAsset) => void
}

export const useCoverStore = create<CoverState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setField: (path, value) =>
        set((state) => ({ config: setPath(state.config, path, value) })),
      // Point de départ de l'éditeur : la capture importée sur l'accueil, dont on
      // reprend la couleur dominante comme couleur de marque.
      startFrom: (image) =>
        set((state) => {
          // Une capture portrait appelle le template dédié au mobile.
          const template = isPortrait(image)
            ? "mobile-trio"
            : state.config.template === "mobile-trio"
              ? DEFAULT_CONFIG.template
              : state.config.template
          return {
            config: {
              ...state.config,
              template,
              style: image.dominant
                ? { ...state.config.style, brandColor: image.dominant }
                : state.config.style,
              mockups: { ...state.config.mockups, images: [image] },
            },
          }
        }),
    }),
    {
      name: "cover-generator",
      // v2 : on abandonne les textes sauvegardés à partir des anciens exemples.
      version: 2,
      migrate: () => ({}),
      storage: createJSONStorage(() => localStorage),
      // Réhydraté côté client par l'éditeur, pour éviter un écart SSR/client.
      skipHydration: true,
      // Les images ne sont pas persistées en V1 (poids).
      partialize: ({ config }) => ({
        config: { ...config, mockups: { ...config.mockups, images: [] } },
      }),
      merge: (persisted, current) => {
        const saved = (persisted as Partial<CoverState> | undefined)?.config
        if (!saved) return current
        return {
          ...current,
          config: {
            ...current.config,
            ...saved,
            content: { ...current.config.content, ...saved.content },
            style: { ...current.config.style, ...saved.style },
            // Les captures en mémoire priment : elles ne sont jamais sauvegardées.
            mockups: {
              ...current.config.mockups,
              browserTheme: saved.mockups?.browserTheme ?? current.config.mockups.browserTheme,
            },
          },
        }
      },
    }
  )
)

let hydrated = false

/** Recharge textes et couleurs sauvegardés, une seule fois par session. */
export function hydrateCoverStore() {
  if (hydrated) return
  hydrated = true
  useCoverStore.persist.rehydrate()
}
