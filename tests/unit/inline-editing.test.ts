import { createElement, type ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { I18nProvider } from "@/i18n/provider"
import { placeImages } from "@/lib/slots"
import { EditingContext, type EditingApi } from "@/templates/shared/editable"
import { TypographyContext } from "@/templates/shared/typography"
import { templates } from "@/templates/registry"
import { defaultConfig } from "@/templates/showcase/defaults"
import type { CoverConfig, Template } from "@/types/cover"

const noop = () => {}
const api: EditingApi = {
  selection: null,
  editing: false,
  select: noop,
  startEditing: noop,
  update: noop,
  commit: noop,
  maxLength: () => undefined,
  label: (field) => field,
}

function render(template: Template, config: CoverConfig, editing: EditingApi | null) {
  const cover = createElement(template.component, { config: placeImages(config, template) })
  return renderToStaticMarkup(
    createElement(
      I18nProvider,
      // Les enfants passent en 3e argument ; le type des props les exige.
      { locale: "en" } as ComponentProps<typeof I18nProvider>,
      createElement(
        TypographyContext,
        { value: config.style },
        createElement(EditingContext, { value: editing }, cover)
      )
    )
  )
}

/** Édition directe (docs/INLINE-EDITING.md) : contrat valable pour tout template. */
describe.each(templates)("édition directe du template « $id »", (template) => {
  const config = { ...defaultConfig("en"), template: template.id }

  it("expose ses textes à l'édition sur l'aperçu principal", () => {
    const html = render(template, config, api)
    for (const path of ["content.badge", "content.nameMain", "content.description", "content.chips.0", "content.footer"]) {
      expect(html, path).toContain(`data-edit-path="${path}"`)
    }
  })

  it("ne rend rien d'éditable sans contexte (miniatures, export)", () => {
    expect(render(template, config, null)).not.toContain("data-edit-path")
  })

  it("applique la police et la couleur choisies par élément", () => {
    const styled: CoverConfig = {
      ...config,
      style: {
        ...config.style,
        textColor: { name: "#123456" },
        textFont: { description: "playfair" },
      },
    }
    const html = render(template, styled, null)
    expect(html).toContain("color:#123456")
    expect(html).toContain("var(--font-playfair)")
  })
})
