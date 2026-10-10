"use client"

import { Check, Minus, Pencil, Plus, RotateCcw, Type, X } from "lucide-react"
import type { ReactNode } from "react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLocale, useTranslations } from "@/i18n/provider"
import { clamp, cssToHex } from "@/lib/color"
import { FONTS, SCALE_MAX, SCALE_MIN, fontStack, getFont } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { useCoverStore } from "@/stores/cover-store"
import { COLOR_PRESETS } from "@/templates/showcase/defaults"

const HEIGHT = 44
const GAP = 12
/** Demi-largeur approximative : garde la barre dans la fenêtre. */
const HALF_WIDTH = 190
const STEP = 0.1

/**
 * Barre d'outils de l'élément de texte sélectionné (docs/INLINE-EDITING.md
 * §2.2), en position fixe au-dessus de lui, en dessous s'il manque de place.
 */
export function TextToolbar({
  anchor,
  target,
}: {
  anchor: DOMRect
  /** Sélecteur du texte, pour lire sa couleur calculée. */
  target: string
}) {
  const t = useTranslations("inlineEditing")
  const locale = useLocale()
  const selection = useCoverStore((state) => state.selection)
  const editing = useCoverStore((state) => state.editing)
  const style = useCoverStore((state) => state.config.style)
  const setField = useCoverStore((state) => state.setField)
  const setSelection = useCoverStore((state) => state.setSelection)
  const setEditing = useCoverStore((state) => state.setEditing)
  if (!selection) return null

  const element = selection.element
  const scale = style.textScale?.[element] ?? 1
  const font = style.textFont?.[element]
  const color = style.textColor?.[element]
  const shown = color ?? computedColor(target)

  const above = anchor.top - GAP - HEIGHT
  const top = above >= 8 ? above : anchor.bottom + GAP
  const left = clamp(
    anchor.left + anchor.width / 2,
    HALF_WIDTH + 8,
    Math.max(HALF_WIDTH + 8, window.innerWidth - HALF_WIDTH - 8)
  )

  function setScale(next: number) {
    setField(
      `style.textScale.${element}`,
      Math.round(clamp(next, SCALE_MIN, SCALE_MAX) * 100) / 100
    )
  }

  return (
    <div
      role="toolbar"
      aria-label={t("toolbarLabel")}
      data-inline-toolbar=""
      // Garde le focus dans le texte en saisie : on peut régler la taille en
      // tapant. Les popovers (portails) gardent leur comportement normal.
      onMouseDown={(event) => {
        if (
          event.currentTarget.contains(event.target as Node) &&
          !(event.target as HTMLElement).closest("input")
        )
          event.preventDefault()
      }}
      className="fixed z-40 flex h-11 max-w-[calc(100vw-16px)] -translate-x-1/2 items-center gap-0.5 rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
      style={{ left, top }}
    >
      {!editing && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil data-icon="inline-start" />
            {t("edit")}
          </Button>
          <Divider />
        </>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("smaller")}
        disabled={scale <= SCALE_MIN}
        onClick={() => setScale(scale - STEP)}
      >
        <Minus />
      </Button>
      <button
        type="button"
        aria-label={t("sizeReset")}
        title={t("sizeReset")}
        onClick={() => setScale(1)}
        className="h-7 min-w-12 rounded-md px-1 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {new Intl.NumberFormat(locale, { style: "percent" }).format(scale)}
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("larger")}
        disabled={scale >= SCALE_MAX}
        onClick={() => setScale(scale + STEP)}
      >
        <Plus />
      </Button>

      <Divider />

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="sm" aria-label={t("font")}>
              <Type data-icon="inline-start" />
              <span className="max-w-24 truncate">
                {font ? getFont(font).label : t("templateFont")}
              </span>
            </Button>
          }
        />
        <PopoverContent side="bottom" className="w-56 gap-1 p-1">
          <div
            role="radiogroup"
            aria-label={t("font")}
            className="flex flex-col"
          >
            <FontOption
              checked={!font}
              onSelect={() => setField(`style.textFont.${element}`, undefined)}
            >
              {t("templateFont")}
            </FontOption>
            {FONTS.map((option) => (
              <FontOption
                key={option.id}
                checked={font === option.id}
                fontFamily={fontStack(option.id)}
                onSelect={() =>
                  setField(`style.textFont.${element}`, option.id)
                }
              >
                {option.label}
              </FontOption>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={t("color")}>
              <span
                className="size-4 rounded-full ring-1 ring-foreground/20"
                style={{ background: shown }}
              />
            </Button>
          }
        />
        <PopoverContent side="bottom" className="w-60 gap-3 p-3">
          <HexColorPicker
            color={shown}
            onChange={(next) => setField(`style.textColor.${element}`, next)}
            className="canva-picker"
          />
          <HexColorInput
            color={shown}
            onChange={(next) => setField(`style.textColor.${element}`, next)}
            prefixed
            aria-label={t("colorHex")}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={preset}
                aria-label={t("colorPreset", { color: preset })}
                aria-pressed={preset.toLowerCase() === color?.toLowerCase()}
                onClick={() => setField(`style.textColor.${element}`, preset)}
                className="aspect-square rounded-md ring-1 ring-foreground/10 outline-none ring-inset focus-visible:ring-3 focus-visible:ring-ring/60 aria-pressed:ring-2 aria-pressed:ring-primary"
                style={{ background: preset }}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!color}
            onClick={() => setField(`style.textColor.${element}`, undefined)}
          >
            <RotateCcw data-icon="inline-start" />
            {t("colorReset")}
          </Button>
        </PopoverContent>
      </Popover>

      <Divider />

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("close")}
        onClick={() => setSelection(null)}
      >
        <X />
      </Button>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
}

function FontOption({
  checked,
  fontFamily,
  onSelect,
  children,
}: {
  checked: boolean
  fontFamily?: string
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      style={{ fontFamily }}
      className={cn(
        "flex h-9 items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        checked && "text-primary"
      )}
    >
      {children}
      {checked && <Check className="size-4" />}
    </button>
  )
}

/** Couleur affichée par le template, quand aucune n'est choisie. */
function computedColor(selector: string) {
  const node = document.querySelector<HTMLElement>(selector)
  return node ? cssToHex(getComputedStyle(node).color) : "#000000"
}
