import type { Slot, Template } from "@/types/cover"

import { AuroraTemplate } from "./aurora/Template"
import { BentoTemplate } from "./bento/Template"
import { BrutalTemplate } from "./brutal/Template"
import { CalloutsTemplate } from "./callouts/Template"
import { CascadeTemplate } from "./cascade/Template"
import { EditorialTemplate } from "./editorial/Template"
import { FocusTemplate } from "./focus/Template"
import { MobileTrioTemplate } from "./mobile-trio/Template"
import { PerspectiveTemplate } from "./perspective/Template"
import { PosterTemplate } from "./poster/Template"
import { RibbonTemplate } from "./ribbon/Template"
import { ShowcaseTemplate } from "./showcase/Template"
import { SpotlightTemplate } from "./spotlight/Template"
import { StoreTemplate } from "./store/Template"
import { TerminalTemplate } from "./terminal/Template"
import { baseSchema, mobileTrioSchema } from "./shared/schema"
import { COVER_SIZE } from "./shared/mockups"

const BROWSER_AND_PHONE: Slot[] = [
  { kind: "desktop", labelKey: "browser", key: "desktopImage" },
  { kind: "mobile", labelKey: "phone", key: "mobileImage" },
]

const ONE_PHONE: Slot[] = [{ kind: "mobile", labelKey: "phone", key: "mobileImage" }]

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
    tags: ["desktop", "dark", "colorful"],
  },
  {
    id: "spotlight",
    nameKey: "spotlightName",
    descriptionKey: "spotlightDescription",
    size: COVER_SIZE,
    component: SpotlightTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "light", "minimal"],
  },
  {
    id: "bento",
    nameKey: "bentoName",
    descriptionKey: "bentoDescription",
    size: COVER_SIZE,
    component: BentoTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "light"],
  },
  {
    id: "perspective",
    nameKey: "perspectiveName",
    descriptionKey: "perspectiveDescription",
    size: COVER_SIZE,
    component: PerspectiveTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "dark"],
  },
  {
    id: "mobile-trio",
    nameKey: "mobileTrioName",
    descriptionKey: "mobileTrioDescription",
    size: COVER_SIZE,
    component: MobileTrioTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
    tags: ["mobile", "light", "minimal"],
  },
  {
    id: "editorial",
    nameKey: "editorialName",
    descriptionKey: "editorialDescription",
    size: COVER_SIZE,
    component: EditorialTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "light", "minimal"],
  },
  {
    id: "aurora",
    nameKey: "auroraName",
    descriptionKey: "auroraDescription",
    size: COVER_SIZE,
    component: AuroraTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "dark", "colorful"],
  },
  {
    id: "brutal",
    nameKey: "brutalName",
    descriptionKey: "brutalDescription",
    size: COVER_SIZE,
    component: BrutalTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "light", "colorful", "playful"],
  },
  {
    id: "terminal",
    nameKey: "terminalName",
    descriptionKey: "terminalDescription",
    size: COVER_SIZE,
    component: TerminalTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "dark", "minimal"],
  },
  {
    id: "poster",
    nameKey: "posterName",
    descriptionKey: "posterDescription",
    size: COVER_SIZE,
    component: PosterTemplate,
    schema: baseSchema,
    slots: BROWSER_AND_PHONE,
    tags: ["desktop", "colorful", "playful"],
  },
  {
    id: "store",
    nameKey: "storeName",
    descriptionKey: "storeDescription",
    size: COVER_SIZE,
    component: StoreTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
    tags: ["mobile", "light", "colorful"],
  },
  {
    id: "focus",
    nameKey: "focusName",
    descriptionKey: "focusDescription",
    size: COVER_SIZE,
    component: FocusTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
    tags: ["mobile", "dark"],
  },
  {
    id: "cascade",
    nameKey: "cascadeName",
    descriptionKey: "cascadeDescription",
    size: COVER_SIZE,
    component: CascadeTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
    tags: ["mobile", "light", "minimal"],
  },
  {
    id: "callouts",
    nameKey: "calloutsName",
    descriptionKey: "calloutsDescription",
    size: COVER_SIZE,
    component: CalloutsTemplate,
    schema: mobileTrioSchema,
    slots: ONE_PHONE,
    tags: ["mobile", "light", "playful"],
  },
  {
    id: "ribbon",
    nameKey: "ribbonName",
    descriptionKey: "ribbonDescription",
    size: COVER_SIZE,
    component: RibbonTemplate,
    schema: mobileTrioSchema,
    slots: THREE_PHONES,
    tags: ["mobile", "colorful", "playful"],
  },
]

export function getTemplate(id: string | undefined): Template {
  return templates.find((template) => template.id === id) ?? templates[0]
}
