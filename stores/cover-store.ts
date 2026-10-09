import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { setPath } from "@/lib/path"
import { DEFAULT_CONFIG } from "@/templates/showcase/defaults"
import type { CoverConfig, ImageAsset } from "@/types/cover"

type CoverState = {
  config: CoverConfig
  setField: (path: string, value: unknown) => void
  startFrom: (images: { desktop?: ImageAsset; mobile?: ImageAsset }) => void
}

export const useCoverStore = create<CoverState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setField: (path, value) =>
        set((state) => ({ config: setPath(state.config, path, value) })),
      // Point de départ de l'éditeur : les captures de l'utilisateur, dont on
      // reprend la couleur dominante comme couleur de marque.
      startFrom: ({ desktop, mobile }) =>
        set((state) => {
          const brandColor = desktop?.dominant ?? mobile?.dominant
          return {
            config: {
              ...state.config,
              style: brandColor
                ? { ...state.config.style, brandColor }
                : state.config.style,
              mockups: {
                ...state.config.mockups,
                desktopImage: desktop,
                mobileImage: mobile,
                showDesktop: Boolean(desktop),
                showMobile: Boolean(mobile),
              },
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
        config: {
          ...config,
          mockups: {
            ...config.mockups,
            desktopImage: undefined,
            mobileImage: undefined,
          },
        },
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
            mockups: { ...current.config.mockups, ...saved.mockups },
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
