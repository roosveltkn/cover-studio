"use client"

import { Trash2, Upload } from "lucide-react"
import { useState, type DragEvent } from "react"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n/provider"
import { ACCEPTED_TYPES, describeImageError, formatList, readImage } from "@/lib/image"
import { cn } from "@/lib/utils"
import type { ImageAsset } from "@/types/cover"

type FileInputProps = {
  id: string
  value?: ImageAsset
  onChange: (value: ImageAsset | undefined) => void
  /** Types MIME acceptés, PNG, JPEG et WebP par défaut. */
  types?: string[]
  /** Aperçu carré non rogné, pour une icône. */
  contain?: boolean
  /** Zone d'import sur une ligne, à la hauteur d'un champ texte. */
  compact?: boolean
}

/** Zone de dépôt puis carte fichier (FileInput + FileInputItem de Canva). */
export function FileInput({
  id,
  value,
  onChange,
  types = ACCEPTED_TYPES,
  contain = false,
  compact = false,
}: FileInputProps) {
  const t = useTranslations("fileInput")
  const tErrors = useTranslations("errors")
  const [error, setError] = useState<string>()
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handle(file?: File) {
    if (!file) return
    setError(undefined)
    setLoading(true)
    try {
      onChange(await readImage(file, types))
    } catch (err) {
      setError(describeImageError(err, tErrors))
    } finally {
      setLoading(false)
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    handle(event.dataTransfer.files[0])
  }

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg border bg-background dark:bg-input/30",
          compact ? "h-10 gap-2 px-1.5" : "gap-3 p-2"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.dataUrl}
          alt=""
          className={cn(
            "shrink-0 rounded-md ring-1 ring-foreground/10",
            compact ? "size-7" : "size-12",
            contain ? "bg-muted object-contain p-1" : "object-cover object-top"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          {!compact && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {value.width} × {value.height}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size={compact ? "icon-sm" : "icon"}
          aria-label={t("remove", { name: value.name })}
          onClick={() => onChange(undefined)}
        >
          <Trash2 />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        title={compact ? t("dropHint", { formats: formatList(types) }) : undefined}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-input text-center transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          compact ? "h-10 gap-2 px-3" : "flex-col gap-1.5 px-4 py-5",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <Upload className={cn("text-muted-foreground", compact ? "size-4" : "size-5")} />
        <span className="text-sm font-semibold">
          {loading ? t("reading") : t("import")}
        </span>
        {!compact && (
          <span className="text-xs text-muted-foreground">
            {t("dropHint", { formats: formatList(types) })}
          </span>
        )}
        <input
          id={id}
          type="file"
          accept={types.join(",")}
          className="sr-only"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            handle(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
