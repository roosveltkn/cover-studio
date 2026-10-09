"use client"

import { FileInput } from "@/components/canva/file-input"
import { FormField } from "@/components/canva/form-field"
import { ImageGallery } from "@/components/canva/image-gallery"
import { PillsInput } from "@/components/canva/pills-input"
import { Swatch } from "@/components/canva/swatch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale, useTranslations } from "@/i18n/provider"
import { pluralSuffix } from "@/i18n/translator"
import { FONTS, SCALE_MAX, SCALE_MIN, SCALE_STEP, fontStack, getFont } from "@/lib/fonts"
import { ICON_TYPES } from "@/lib/image"
import { getPath } from "@/lib/path"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"
import type { FieldSchema, ImageAsset } from "@/types/cover"

/** Rend un champ de formulaire à partir de son schéma (SPECS §8.4). */
export function SchemaField({ field }: { field: FieldSchema }) {
  const t = useTranslations("fields")
  const tSlots = useTranslations("slots")
  const tTemplates = useTranslations("templates")
  const locale = useLocale()
  const config = useCoverStore((state) => state.config)
  const setField = useCoverStore((state) => state.setField)
  const value = getPath(config, field.path)
  const id = `field-${field.path.replace(/\./g, "-")}`
  const set = (next: unknown) => setField(field.path, next)
  const label = t(field.label)
  const help = field.help ? t(field.help) : undefined

  switch (field.type) {
    case "text": {
      const text = (value as string | undefined) ?? ""
      const error = field.required && !text.trim() ? t("required") : undefined
      return (
        <FormField
          id={id}
          label={label}
          help={help}
          error={error}
          counter={field.maxLength ? `${text.length}/${field.maxLength}` : undefined}
        >
          <Input
            id={id}
            value={text}
            maxLength={field.maxLength}
            placeholder={field.placeholder ? t(field.placeholder) : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
            onChange={(event) => set(event.target.value)}
            className="h-10"
          />
        </FormField>
      )
    }

    case "textarea": {
      const text = (value as string | undefined) ?? ""
      return (
        <FormField
          id={id}
          label={label}
          help={help}
          counter={field.maxLength ? `${text.length}/${field.maxLength}` : undefined}
        >
          <Textarea
            id={id}
            value={text}
            maxLength={field.maxLength}
            placeholder={field.placeholder ? t(field.placeholder) : undefined}
            aria-describedby={help ? `${id}-help` : undefined}
            onChange={(event) => set(event.target.value)}
            className="max-h-48 min-h-24 resize-none"
          />
        </FormField>
      )
    }

    case "list":
      return (
        <FormField id={id} label={label} help={help}>
          <PillsInput
            id={id}
            value={(value as string[] | undefined) ?? []}
            onChange={set}
            placeholder={field.placeholder ? t(field.placeholder) : undefined}
          />
        </FormField>
      )

    case "color":
      return (
        <FormField id={id} label={label} help={help}>
          <Swatch
            id={id}
            value={(value as string | undefined) ?? "#000000"}
            onChange={set}
            presets={field.presets}
          />
        </FormField>
      )

    case "font": {
      const current = getFont(value as string | undefined).id
      return (
        <FormField id={id} label={label} help={help}>
          <div id={id} role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
            {FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                role="radio"
                aria-checked={font.id === current}
                onClick={() => set(font.id)}
                style={{ fontFamily: fontStack(font.id) }}
                className={
                  "h-11 rounded-lg border px-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 " +
                  (font.id === current
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-foreground/5")
                }
              >
                {font.label}
              </button>
            ))}
          </div>
        </FormField>
      )
    }

    case "scale": {
      const scale = (value as number | undefined) ?? 1
      return (
        <FormField id={id} label={label} help={help} counter={`${Math.round(scale * 100)} %`}>
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="range"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={SCALE_STEP}
              value={scale}
              onChange={(event) => set(Number(event.target.value))}
              className="h-2 flex-1 cursor-pointer accent-primary"
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={scale === 1}
              onClick={() => set(1)}
            >
              {t("scaleReset")}
            </Button>
          </div>
        </FormField>
      )
    }

    case "icon": {
      const icon = value as ImageAsset | undefined
      const brandColor = config.style.brandColor
      const iconColor = icon?.dominant
      return (
        <FormField id={id} label={label} help={help}>
          <FileInput id={id} value={icon} onChange={set} types={ICON_TYPES} contain />
          {iconColor && iconColor.toLowerCase() !== brandColor.toLowerCase() && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setField("style.brandColor", iconColor)}
            >
              <span
                aria-hidden
                className="size-3.5 rounded-full ring-1 ring-foreground/15"
                style={{ background: iconColor }}
              />
              {t("useIconColor")}
            </Button>
          )}
        </FormField>
      )
    }

    case "gallery": {
      const template = getTemplate(config.template)
      const filled = template.slots.length
      return (
        <FormField id={id} label={label} help={help}>
          <p className="text-xs text-muted-foreground">
            {t(`galleryUses${pluralSuffix(locale, filled)}`, {
              template: tTemplates(template.nameKey),
              count: filled,
              slots: template.slots
                .map((slot) => tSlots(slot.labelKey).toLocaleLowerCase(locale))
                .join(", "),
            })}
          </p>
          <ImageGallery
            id={id}
            images={(value as ImageAsset[] | undefined) ?? []}
            slots={template.slots}
            onChange={set}
          />
        </FormField>
      )
    }

    case "segmented":
      return (
        <FormField id={id} label={label} help={help}>
          <ToggleGroup
            id={id}
            variant="outline"
            spacing={0}
            value={[(value as string | undefined) ?? field.options[0].value]}
            onValueChange={(next) => next[0] && set(next[0])}
            className="w-full"
          >
            {field.options.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="h-9 flex-1 data-[pressed]:bg-primary/10 data-[pressed]:text-primary"
              >
                {t(option.label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FormField>
      )
  }
}
