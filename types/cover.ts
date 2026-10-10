import type { ComponentType } from "react"

import type { MessageKey } from "@/i18n/translator"

export type ImageAsset = {
  id: string
  dataUrl: string
  width: number
  height: number
  name: string
  /** Luminance relative moyenne (0–1), pour le thème auto du navigateur. */
  luminance: number
  /** Couleur moyenne de la bande haute, pour la zone de statut du téléphone. */
  topColor: string
  /** Couleur moyenne de la bande basse, pour combler une capture plus courte que l'écran. */
  bottomColor?: string
  /** Couleur vive dominante, proposée comme couleur de marque. */
  dominant?: string
}

export type BrowserTheme = "auto" | "light" | "dark"

export type TextElement = "badge" | "name" | "description" | "chips" | "footer"

export type CoverConfig = {
  /** Identifiant du template dans le registre. */
  template: string
  content: {
    /** Icône de l'application, affichée à côté du nom. */
    icon?: ImageAsset
    badge: string
    nameMain: string
    nameAccent?: string
    description: string
    chips: string[]
    footer: string
    browserUrl: string
  }
  style: {
    brandColor: string
    accentColor?: string
    haloIntensity?: number
    gridOpacity?: number
    /** Identifiant de la police (cf. lib/fonts), Poppins par défaut. */
    fontFamily?: string
    /** Multiplicateur de taille par élément de texte, 1 par défaut. */
    textScale?: Partial<Record<TextElement, number>>
  }
  mockups: {
    /** Captures importées, dans l'ordre choisi par l'utilisateur. */
    images: ImageAsset[]
    browserTheme?: BrowserTheme
    desktopCropY?: number
  }
  export: {
    format: "png"
    scale: 1 | 2
    /** Identifiant du format (cf. lib/export-sizes), "cover" par défaut. */
    size?: string
  }
}

/** Emplacement de capture prévu par un template. */
export type Slot = {
  kind: "desktop" | "mobile"
  /** Clé du libellé dans le namespace `slots`. */
  labelKey: MessageKey<"slots">
  /** Champ des mockups placés où le template lit cette capture. */
  key: "desktopImage" | "mobileImage" | "mobileImage2" | "mobileImage3"
}

/** Mockups tels que les templates les lisent, une fois les captures placées. */
export type PlacedMockups = CoverConfig["mockups"] & {
  desktopImage?: ImageAsset
  mobileImage?: ImageAsset
  mobileImage2?: ImageAsset
  mobileImage3?: ImageAsset
  showDesktop: boolean
  showMobile: boolean
}

export type PlacedConfig = Omit<CoverConfig, "mockups"> & { mockups: PlacedMockups }

export type SectionId = "content" | "typography" | "colors" | "mockups" | "export"

/** Panneau ouvert dans l'éditeur : les modèles, ou une section de champs. */
export type PanelId = "templates" | SectionId

/** Clé de message du namespace `fields` : le schéma ne porte aucun texte traduit. */
type FieldKey = MessageKey<"fields">

type FieldBase = {
  /** Chemin pointé dans CoverConfig, ex. "content.badge". */
  path: string
  label: FieldKey
  section: SectionId
  help?: FieldKey
}

export type FieldSchema =
  | (FieldBase & {
      type: "text"
      placeholder?: FieldKey
      maxLength?: number
      required?: boolean
    })
  | (FieldBase & {
      type: "textarea"
      placeholder?: FieldKey
      maxLength?: number
    })
  | (FieldBase & { type: "list"; placeholder?: FieldKey })
  | (FieldBase & { type: "color"; presets?: string[] })
  | (FieldBase & { type: "gallery" })
  | (FieldBase & { type: "icon" })
  | (FieldBase & { type: "font" })
  | (FieldBase & { type: "scale" })
  | (FieldBase & {
      type: "segmented"
      options: { value: string; label: FieldKey }[]
    })

/** Étiquettes de filtre des modèles : libellés dans le namespace `templateTags`. */
export type TemplateTag =
  | "mobile"
  | "desktop"
  | "light"
  | "dark"
  | "colorful"
  | "minimal"
  | "playful"

/** Recherche et étiquettes actives dans le panneau des modèles. */
export type TemplateFilter = { query: string; tags: TemplateTag[] }

export type Template = {
  id: string
  /** Clés des textes dans le namespace `templates`. */
  nameKey: MessageKey<"templates">
  descriptionKey: MessageKey<"templates">
  size: { width: number; height: number }
  component: ComponentType<{ config: PlacedConfig }>
  schema: FieldSchema[]
  /** Emplacements remplis dans l'ordre de la liste des captures. */
  slots: Slot[]
  /** Étiquettes proposées en filtre dans le panneau des modèles. */
  tags: TemplateTag[]
}
