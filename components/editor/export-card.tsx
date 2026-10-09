"use client"

import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslations } from "@/i18n/provider"
import { EXPORT_SIZES } from "@/lib/export-sizes"
import { cn } from "@/lib/utils"
import { useCoverStore } from "@/stores/cover-store"

import { useExport } from "./use-export"

export function ExportCard() {
  const t = useTranslations("export")
  const tSizes = useTranslations("exportSizes")
  const { run, exporting, filename, output, scale, pixels } = useExport()
  const setField = useCoverStore((state) => state.setField)

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">{t("format")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_SIZES.map((size) => {
            const selected = size.id === output.id
            return (
              <button
                key={size.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setField("export.size", size.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected && "border-primary bg-primary/5 hover:bg-primary/10"
                )}
              >
                <RatioIcon width={size.width} height={size.height} selected={selected} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{tSizes(size.labelKey)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {size.width} × {size.height}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("hint", { hint: tSizes(output.hintKey) })}
        </p>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="export-hd" className="flex flex-col items-start gap-0.5">
          <span className="text-[13px] font-semibold">{t("hdLabel")}</span>
          <span className="text-xs font-normal text-muted-foreground">{t("hdHint")}</span>
        </Label>
        <Switch
          id="export-hd"
          checked={scale === 2}
          onCheckedChange={(checked) => setField("export.scale", checked ? 2 : 1)}
        />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted p-3 text-sm">
        <dt className="text-muted-foreground">{t("size")}</dt>
        <dd className="font-medium tabular-nums">
          {t("pixels", { width: pixels.width, height: pixels.height })}
        </dd>
        <dt className="text-muted-foreground">{t("file")}</dt>
        <dd className="truncate font-medium" title={filename}>
          {filename}
        </dd>
      </dl>

      <Button size="lg" className="h-10 w-full" onClick={run} disabled={exporting}>
        {exporting ? <Loader2 className="animate-spin" /> : <Download />}
        {exporting ? t("generating") : t("downloadPng")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  )
}

/** Rectangle aux proportions du format. */
function RatioIcon({
  width,
  height,
  selected,
}: {
  width: number
  height: number
  selected: boolean
}) {
  const max = 22
  const ratio = width / height
  const w = ratio >= 1 ? max : max * ratio
  const h = ratio >= 1 ? max / ratio : max
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center">
      <span
        className={cn(
          "rounded-[3px] border-2",
          selected ? "border-primary bg-primary/15" : "border-muted-foreground/50"
        )}
        style={{ width: w, height: h }}
      />
    </span>
  )
}
