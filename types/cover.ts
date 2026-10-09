import type { ComponentType } from "react"

export type ImageAsset = {
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
    desktopImage?: ImageAsset
    mobileImage?: ImageAsset
    showDesktop: boolean
    showMobile: boolean
    browserTheme?: BrowserTheme
    desktopCropY?: number
  }
  export: {
    format: "png"
    scale: 1 | 2
  }
}

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
  | (FieldBase & { type: "image"; toggle: string })
  | (FieldBase & {
      type: "segmented"
      options: { value: string; label: string }[]
    })

export type Template = {
  id: string
  name: string
  size: { width: number; height: number }
  component: ComponentType<{ config: CoverConfig }>
  schema: FieldSchema[]
}
