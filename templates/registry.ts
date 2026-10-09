import type { Slot, Template } from "@/types/cover"

import { BentoTemplate } from "./bento/Template"
import { MobileTrioTemplate } from "./mobile-trio/Template"
import { PerspectiveTemplate } from "./perspective/Template"
import { baseSchema, mobileTrioSchema } from "./shared/schema"
import { COVER_SIZE } from "./shared/mockups"
import { ShowcaseTemplate } from "./showcase/Template"
import { SpotlightTemplate } from "./spotlight/Template"

const BROWSER_AND_PHONE: Slot[] = [
  { kind: "desktop", label: "Navigateur", key: "desktopImage" },
  { kind: "mobile", label: "Téléphone", key: "mobileImage" },
]

const THREE_PHONES: Slot[] = [
  { kind: "mobile", label: "Téléphone central", key: "mobileImage" },
  { kind: "mobile", label: "Téléphone gauche", key: "mobileImage2" },
  { kind: "mobile", label: "Téléphone droit", key: "mobileImage3" },
]

export const templates: Template[] = [
  {
    id: "showcase",
    name: "Showcase",
    description: "Texte à gauche, navigateur et téléphone",
    size: COVER_SIZE,
    component: ShowcaseTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Centré et clair, style lancement",
    size: COVER_SIZE,
    component: SpotlightTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "bento",
    name: "Bento",
    description: "Grille de tuiles arrondies",
    size: COVER_SIZE,
    component: BentoTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "perspective",
    name: "Perspective",
    description: "Scène sombre, mockups inclinés en 3D",
    size: COVER_SIZE,
    component: PerspectiveTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "mobile-trio",
    name: "Mobile trio",
    description: "Trois téléphones, pour les apps mobiles",
    size: COVER_SIZE,
    component: MobileTrioTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
  },
]

export function getTemplate(id: string | undefined): Template {
  return templates.find((template) => template.id === id) ?? templates[0]
}
