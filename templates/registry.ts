import type { Template } from "@/types/cover"

import { showcaseSchema } from "./showcase/schema"
import { SHOWCASE_SIZE, ShowcaseTemplate } from "./showcase/Template"

export const showcase: Template = {
  id: "showcase",
  name: "Showcase",
  size: SHOWCASE_SIZE,
  component: ShowcaseTemplate,
  schema: showcaseSchema,
}

export const templates: Template[] = [showcase]
