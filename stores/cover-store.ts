import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { defaultLocale, type Locale } from "@/i18n/routing"
import { setPath } from "@/lib/path"
import { isPortrait } from "@/lib/slots"
import { DEFAULT_CONFIG, DEFAULT_TEMPLATE, localizeContent } from "@/templates/showcase/defaults"
import type { CoverConfig, ImageAsset, PanelId, TemplateTag } from "@/types/cover"

/** Choix faits sur l'accueil ; ce qui manque est déduit des captures. */
export type StartOptions = {
  template?: string
  icon?: ImageAsset
  brandColor?: string
}

type CoverState = {
  config: CoverConfig
  /** Langue de la page, jamais persistée : elle vient de l'URL. */
  locale: Locale
  /**
   * Panneau ouvert de l'éditeur. Dans le store plutôt qu'en état local : changer de
   * langue recrée la page, et l'utilisateur doit retrouver son panneau.
   */
  activePanel: PanelId
  setActivePanel: (panel: PanelId) => void
  /** Étiquettes cochées dans le panneau des modèles : survivent au changement de langue, jamais persistées. */
  templateTags: TemplateTag[]
  setTemplateTags: (tags: TemplateTag[]) => void
  setField: (path: string, value: unknown) => void
  startFrom: (images: ImageAsset[], options?: StartOptions) => void
  /** Passe les textes d'exemple dans la langue de la page, sans toucher à ceux modifiés. */
  applyLocale: (locale: Locale) => void
}

export const useCoverStore = create<CoverState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      locale: defaultLocale,
      activePanel: "templates",
      setActivePanel: (activePanel) => set({ activePanel }),
      templateTags: [],
      setTemplateTags: (templateTags) => set({ templateTags }),
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
      // Point de départ de l'éditeur : les captures, l'icône, la couleur et le
      // modèle choisis sur l'accueil. Sans couleur choisie, la couleur dominante
      // de la première capture devient la couleur de marque.
      startFrom: (images, options = {}) =>
        set((state) => {
          const brandColor = options.brandColor ?? images[0]?.dominant
          // Des captures toutes en portrait appellent le template dédié au mobile.
          const template = options.template
            ? options.template
            : images.every(isPortrait)
            ? "mobile-trio"
            : state.config.template === "mobile-trio"
              ? DEFAULT_TEMPLATE
              : state.config.template
          return {
            config: {
              ...state.config,
              template,
              content: options.icon
                ? { ...state.config.content, icon: options.icon }
                : state.config.content,
              style: brandColor ? { ...state.config.style, brandColor } : state.config.style,
              mockups: { ...state.config.mockups, images },
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
