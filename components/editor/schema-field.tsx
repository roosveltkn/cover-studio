"use client"

import { FileInput } from "@/components/canva/file-input"
import { FormField } from "@/components/canva/form-field"
import { PillsInput } from "@/components/canva/pills-input"
import { Swatch } from "@/components/canva/swatch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getPath } from "@/lib/path"
import { useCoverStore } from "@/stores/cover-store"
import type { FieldSchema, ImageAsset } from "@/types/cover"

/** Rend un champ de formulaire à partir de son schéma (SPECS §8.4). */
export function SchemaField({ field }: { field: FieldSchema }) {
  const config = useCoverStore((state) => state.config)
  const setField = useCoverStore((state) => state.setField)
  const value = getPath(config, field.path)
  const id = `field-${field.path.replace(/\./g, "-")}`
  const set = (next: unknown) => setField(field.path, next)

  switch (field.type) {
    case "text": {
      const text = (value as string | undefined) ?? ""
      const error = field.required && !text.trim() ? "Ce champ est obligatoire." : undefined
      return (
        <FormField
          id={id}
          label={field.label}
          help={field.help}
          error={error}
          counter={field.maxLength ? `${text.length}/${field.maxLength}` : undefined}
        >
          <Input
            id={id}
            value={text}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : field.help ? `${id}-help` : undefined}
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
          label={field.label}
          help={field.help}
          counter={field.maxLength ? `${text.length}/${field.maxLength}` : undefined}
        >
          <Textarea
            id={id}
            value={text}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            aria-describedby={field.help ? `${id}-help` : undefined}
            onChange={(event) => set(event.target.value)}
            className="max-h-48 min-h-24 resize-none"
          />
        </FormField>
      )
    }

    case "list":
      return (
        <FormField id={id} label={field.label} help={field.help}>
          <PillsInput
            id={id}
            value={(value as string[] | undefined) ?? []}
            onChange={set}
            placeholder={field.placeholder}
          />
        </FormField>
      )

    case "color":
      return (
        <FormField id={id} label={field.label} help={field.help}>
          <Swatch
            id={id}
            value={(value as string | undefined) ?? "#000000"}
            onChange={set}
            presets={field.presets}
          />
        </FormField>
      )

    case "image": {
      const visible = Boolean(getPath(config, field.toggle))
      const toggleId = `${id}-visible`
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={id} className="text-[13px] font-semibold">
              {field.label}
            </Label>
            <div className="flex items-center gap-2">
              <Label htmlFor={toggleId} className="text-xs font-normal text-muted-foreground">
                Afficher
              </Label>
              <Switch
                id={toggleId}
                checked={visible}
                onCheckedChange={(checked) => setField(field.toggle, checked)}
              />
            </div>
          </div>
          <FileInput
            id={id}
            value={value as ImageAsset | undefined}
            onChange={set}
          />
        </div>
      )
    }

    case "segmented":
      return (
        <FormField id={id} label={field.label} help={field.help}>
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
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FormField>
      )
  }
}
