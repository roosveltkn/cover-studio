"use client"

import { Trash2, Upload } from "lucide-react"
import { useState, type DragEvent } from "react"

import { Button } from "@/components/ui/button"
import { ACCEPTED_TYPES, ImageError, readImage } from "@/lib/image"
import { cn } from "@/lib/utils"
import type { ImageAsset } from "@/types/cover"

type FileInputProps = {
  id: string
  value?: ImageAsset
  onChange: (value: ImageAsset | undefined) => void
}

/** Zone de dépôt puis carte fichier (FileInput + FileInputItem de Canva). */
export function FileInput({ id, value, onChange }: FileInputProps) {
  const [error, setError] = useState<string>()
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handle(file?: File) {
    if (!file) return
    setError(undefined)
    setLoading(true)
    try {
      onChange(await readImage(file))
    } catch (err) {
      setError(err instanceof ImageError ? err.message : "Import impossible.")
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
      <div className="flex items-center gap-3 rounded-lg border bg-background p-2 dark:bg-input/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.dataUrl}
          alt=""
          className="size-12 shrink-0 rounded-md object-cover object-top ring-1 ring-foreground/10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {value.width} × {value.height}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Retirer ${value.name}`}
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
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input px-4 py-5 text-center transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {loading ? "Lecture…" : "Importer une image"}
        </span>
        <span className="text-xs text-muted-foreground">
          ou glisser-déposer · PNG, JPEG, WebP · 10 Mo max
        </span>
        <input
          id={id}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
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
