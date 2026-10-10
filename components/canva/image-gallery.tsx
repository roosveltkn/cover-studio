"use client"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ImagePlus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState, type DragEvent } from "react"

import { UrlImport } from "@/components/canva/url-import"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale, useTranslations } from "@/i18n/provider"
import { pluralSuffix } from "@/i18n/translator"
import { captureClient } from "@/lib/capture"
import { ACCEPTED_TYPES, describeImageError, readImage } from "@/lib/image"
import { MAX_IMAGES, isPortrait, slotLabelKeys } from "@/lib/slots"
import { cn } from "@/lib/utils"
import type { ImageAsset, Slot } from "@/types/cover"

type ImageGalleryProps = {
  id: string
  images: ImageAsset[]
  slots: Slot[]
  onChange: (images: ImageAsset[]) => void
}

/**
 * Liste ordonnée des captures : glisser-déposer (souris, tactile ou clavier)
 * pour changer l'ordre, qui décide de l'emplacement de chaque capture.
 */
export function ImageGallery({ id, images, slots, onChange }: ImageGalleryProps) {
  const t = useTranslations("gallery")
  const tUrl = useTranslations("urlImport")
  const labelKeys = slotLabelKeys(images, slots)
  // Ici plutôt que dans la zone d'ajout : elle disparaît une fois la limite atteinte.
  const [error, setError] = useState<string>()
  const [source, setSource] = useState<"files" | "url">("files")
  // Les captures d'URL arrivent une à une, plus vite que le rendu : chaque ajout
  // part de la dernière liste connue, pas de celle du rendu courant.
  const latest = useRef(images)
  useEffect(() => {
    latest.current = images
  }, [images])
  const add = (added: ImageAsset[]) => {
    const next = [...latest.current, ...added].slice(0, MAX_IMAGES)
    latest.current = next
    onChange(next)
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const nameOf = (imageId: string | number) =>
    images.find((image) => image.id === imageId)?.name ?? t("defaultName")
  const positionOf = (imageId: string | number) =>
    images.findIndex((image) => image.id === imageId) + 1

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("dragStart", { name: nameOf(active.id), position: positionOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t("dragOver", { name: nameOf(active.id), position: positionOf(over.id) })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t("dragEnd", { name: nameOf(active.id), position: positionOf(over.id) }) : undefined,
    onDragCancel: ({ active }) => t("dragCancel", { name: nameOf(active.id) }),
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = images.findIndex((image) => image.id === active.id)
    const to = images.findIndex((image) => image.id === over.id)
    onChange(arrayMove(images, from, to))
  }

  return (
    <div className="flex flex-col gap-2">
      {images.length > 0 && (
        <DndContext
          // dnd-kit s'en sert comme id DOM : il ne doit pas être celui de l'input fichier.
          id={`${id}-dnd`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: { draggable: t("instructions") },
          }}
        >
          <SortableContext items={images.map((image) => image.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  position={index + 1}
                  slotLabelKey={labelKeys[index]}
                  onRemove={() => onChange(images.filter((item) => item.id !== image.id))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {images.length < MAX_IMAGES && captureClient && (
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label={tUrl("modeLabel")}
          value={[source]}
          onValueChange={(next) => next[0] && setSource(next[0] as "files" | "url")}
          className="w-full"
        >
          <ToggleGroupItem
            value="files"
            className="flex-1 data-[pressed]:bg-primary/10 data-[pressed]:text-primary"
          >
            {tUrl("modeFiles")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="url"
            className="flex-1 data-[pressed]:bg-primary/10 data-[pressed]:text-primary"
          >
            {tUrl("modeUrl")}
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      {images.length < MAX_IMAGES &&
        (source === "url" && captureClient ? (
          <UrlImport
            id={id}
            client={captureClient}
            remaining={MAX_IMAGES - images.length}
            onAdd={add}
          />
        ) : (
          <AddImages
            id={id}
            remaining={MAX_IMAGES - images.length}
            invalid={Boolean(error)}
            onError={setError}
            onAdd={add}
          />
        ))}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function SortableImage({
  image,
  position,
  slotLabelKey,
  onRemove,
}: {
  image: ImageAsset
  position: number
  slotLabelKey: Slot["labelKey"] | null
  onRemove: () => void
}) {
  const t = useTranslations("gallery")
  const tSlots = useTranslations("slots")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-background p-2 dark:bg-input/30",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary",
        !slotLabelKey && "opacity-60"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={t("move", { name: image.name, position })}
        className="grid h-12 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.dataUrl}
          alt=""
          className="size-12 rounded-md object-cover object-top ring-1 ring-foreground/10"
        />
        <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-semibold text-background tabular-nums">
          {position}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{image.name}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          {slotLabelKey ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {tSlots(slotLabelKey)}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("unused")}</span>
          )}
          <span className="text-muted-foreground">
            {isPortrait(image) ? t("portrait") : t("landscape")}
          </span>
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("remove", { name: image.name })}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </li>
  )
}

function AddImages({
  id,
  remaining,
  invalid,
  onError,
  onAdd,
}: {
  id: string
  remaining: number
  invalid: boolean
  onError: (error: string | undefined) => void
  onAdd: (images: ImageAsset[]) => void
}) {
  const t = useTranslations("gallery")
  const tErrors = useTranslations("errors")
  const locale = useLocale()
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handle(files: FileList | null) {
    if (!files?.length) return
    // Copie immédiate : l'input est vidé juste après l'appel, ce qui vide la FileList.
    const selected = Array.from(files)
    onError(undefined)
    setLoading(true)
    const added: ImageAsset[] = []
    const errors: string[] = []
    for (const file of selected.slice(0, remaining)) {
      try {
        added.push(await readImage(file))
      } catch (err) {
        errors.push(t("fileError", { name: file.name, message: describeImageError(err, tErrors) }))
      }
    }
    if (selected.length > remaining) errors.push(t("limit", { max: MAX_IMAGES }))
    if (added.length) onAdd(added)
    if (errors.length) onError(errors.join(" "))
    setLoading(false)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    handle(event.dataTransfer.files)
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
          "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-3 text-sm transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <ImagePlus className="size-4 text-muted-foreground" />
        <span className="font-semibold">{loading ? t("reading") : t("add")}</span>
        <span className="text-xs text-muted-foreground">
          {t(`remaining${pluralSuffix(locale, remaining)}`, { count: remaining })}
        </span>
        <input
          id={id}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-invalid={invalid}
          onChange={(event) => {
            handle(event.target.files)
            event.target.value = ""
          }}
        />
      </label>
    </div>
  )
}
