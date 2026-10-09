import type { ComponentType } from "react"

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
  /** Couleur vive dominante, proposée comme couleur de marque. */
  dominant?: string
}

export type BrowserTheme = "auto" | "light" | "dark"

export type CoverConfig = {
  /** Identifiant du template dans le registre. */
  template: string
  content: {
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
  label: string
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

export type SectionId = "content" | "colors" | "mockups" | "export"

type FieldBase = {
  /** Chemin pointé dans CoverConfig, ex. "content.badge". */
  path: string
  label: string
  section: SectionId
  help?: string
}

export type FieldSchema =
  | (FieldBase & {
      type: "text"
      placeholder?: string
      maxLength?: number
      required?: boolean
    })
  | (FieldBase & {
      type: "textarea"
      placeholder?: string
      maxLength?: number
    })
  | (FieldBase & { type: "list"; placeholder?: string })
  | (FieldBase & { type: "color"; presets?: string[] })
  | (FieldBase & { type: "gallery" })
  | (FieldBase & {
      type: "segmented"
      options: { value: string; label: string }[]
    })

export type Template = {
  id: string
  name: string
  description: string
  size: { width: number; height: number }
  component: ComponentType<{ config: PlacedConfig }>
  schema: FieldSchema[]
  /** Emplacements remplis dans l'ordre de la liste des captures. */
  slots: Slot[]
}
