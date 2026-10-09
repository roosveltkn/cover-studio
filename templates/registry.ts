import type { Slot, Template } from "@/types/cover"

import { BentoTemplate } from "./bento/Template"
import { MobileTrioTemplate } from "./mobile-trio/Template"
import { PerspectiveTemplate } from "./perspective/Template"
import { baseSchema, mobileTrioSchema } from "./shared/schema"
import { COVER_SIZE } from "./shared/mockups"
import { ShowcaseTemplate } from "./showcase/Template"
import { SpotlightTemplate } from "./spotlight/Template"

const BROWSER_AND_PHONE: Slot[] = [
  { kind: "desktop", labelKey: "browser", key: "desktopImage" },
  { kind: "mobile", labelKey: "phone", key: "mobileImage" },
]

const THREE_PHONES: Slot[] = [
  { kind: "mobile", labelKey: "phoneCenter", key: "mobileImage" },
  { kind: "mobile", labelKey: "phoneLeft", key: "mobileImage2" },
  { kind: "mobile", labelKey: "phoneRight", key: "mobileImage3" },
]

export const templates: Template[] = [
  {
    id: "showcase",
    nameKey: "showcaseName",
    descriptionKey: "showcaseDescription",
    size: COVER_SIZE,
    component: ShowcaseTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "spotlight",
    nameKey: "spotlightName",
    descriptionKey: "spotlightDescription",
    size: COVER_SIZE,
    component: SpotlightTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "bento",
    nameKey: "bentoName",
    descriptionKey: "bentoDescription",
    size: COVER_SIZE,
    component: BentoTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "perspective",
    nameKey: "perspectiveName",
    descriptionKey: "perspectiveDescription",
    size: COVER_SIZE,
    component: PerspectiveTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
  },
  {
    id: "mobile-trio",
    nameKey: "mobileTrioName",
    descriptionKey: "mobileTrioDescription",
    size: COVER_SIZE,
    component: MobileTrioTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
  },
]

export function getTemplate(id: string | undefined): Template {
  return templates.find((template) => template.id === id) ?? templates[0]
}
