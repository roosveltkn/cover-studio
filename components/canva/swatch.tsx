"use client"

import { Check } from "lucide-react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslations } from "@/i18n/provider"
import { cn } from "@/lib/utils"

type SwatchProps = {
  id: string
  value: string
  onChange: (value: string) => void
  presets?: string[]
  /** Pastilles plus petites, sur une seule ligne. */
  compact?: boolean
}

/** Swatch libellé ouvrant un flyout de sélection (pattern « Color selection » de Canva). */
export function Swatch({
  id,
  value,
  onChange,
  presets = [],
  compact = false,
}: SwatchProps) {
  const t = useTranslations("swatch")

  return (
    <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex h-10 w-full items-center gap-3 rounded-lg border border-input bg-background px-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <span
            className="size-7 rounded-md ring-1 ring-foreground/15 ring-inset"
            style={{ background: value }}
          />
          <span className="font-mono uppercase">{value}</span>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 gap-3 p-3">
          <HexColorPicker
            color={value}
            onChange={onChange}
            className="canva-picker"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("hex")}
            </span>
            <HexColorInput
              color={value}
              onChange={onChange}
              prefixed
              aria-label={t("hexAria")}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </PopoverContent>
      </Popover>

      {presets.length > 0 && (
        <div
          role="group"
          aria-label={t("suggested")}
          className={cn(
            "grid",
            compact ? "grid-cols-10 gap-1" : "grid-cols-5 gap-2"
          )}
        >
          {presets.map((preset) => {
            const selected = preset.toLowerCase() === value.toLowerCase()
            return (
              <button
                key={preset}
                type="button"
                title={preset}
                aria-label={t("colorAria", { color: preset })}
                aria-pressed={selected}
                onClick={() => onChange(preset)}
                className={cn(
                  "relative grid aspect-square place-items-center ring-1 ring-foreground/10 transition-transform outline-none ring-inset hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/60",
                  compact ? "rounded-md" : "rounded-lg",
                  selected &&
                    "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                style={{ background: preset }}
              >
                {selected && (
                  <Check
                    className={cn(
                      "text-white mix-blend-difference",
                      compact ? "size-3" : "size-4"
                    )}
                    strokeWidth={3}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
