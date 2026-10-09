import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { defaultLocale, type Locale } from "@/i18n/routing"
import { setPath } from "@/lib/path"
import { isPortrait } from "@/lib/slots"
import { DEFAULT_CONFIG, DEFAULT_TEMPLATE, localizeContent } from "@/templates/showcase/defaults"
import type { CoverConfig, ImageAsset } from "@/types/cover"

type CoverState = {
  config: CoverConfig
  /** Langue de la page, jamais persistée : elle vient de l'URL. */
  locale: Locale
  setField: (path: string, value: unknown) => void
  startFrom: (image: ImageAsset) => void
  /** Passe les textes d'exemple dans la langue de la page, sans toucher à ceux modifiés. */
  applyLocale: (locale: Locale) => void
}

export const useCoverStore = create<CoverState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      locale: defaultLocale,
      setField: (path, value) =>
        set((state) => ({ config: setPath(state.config, path, value) })),
      applyLocale: (locale) =>
        set((state) => {
          const content = localizeContent(state.config.content, locale)
          return {
            locale,
            config: JSON.stringify(content) === JSON.stringify(state.config.content)
              ? state.config
              : { ...state.config, content },
          }
        }),
      // Point de départ de l'éditeur : la capture importée sur l'accueil, dont on
      // reprend la couleur dominante comme couleur de marque.
      startFrom: (image) =>
        set((state) => {
          // Une capture portrait appelle le template dédié au mobile.
          const template = isPortrait(image)
            ? "mobile-trio"
            : state.config.template === "mobile-trio"
              ? DEFAULT_TEMPLATE
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
        config: {
          ...config,
          content: { ...config.content, icon: undefined },
          mockups: { ...config.mockups, images: [] },
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
            content: {
              ...current.config.content,
              ...saved.content,
              icon: current.config.content.icon,
            },
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
  // Les textes sauvegardés peuvent être ceux d'exemple d'une autre langue.
  const { applyLocale, locale } = useCoverStore.getState()
  applyLocale(locale)
}
