"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { useTranslations } from "@/i18n/provider"
import { useCoverStore } from "@/stores/cover-store"
import type { EditingApi } from "@/templates/shared/editable"
import type { EditableField, Template } from "@/types/cover"

import { TextToolbar } from "./text-toolbar"

const LABELS = {
  badge: "badgeLabel",
  nameMain: "nameMainLabel",
  nameAccent: "nameAccentLabel",
  description: "descriptionLabel",
  footer: "footerLabel",
} as const

/** Rappels de l'édition directe (docs/INLINE-EDITING.md), branchés sur le store. */
export function useEditingApi(template: Template): EditingApi {
  const tFields = useTranslations("fields")
  const t = useTranslations("inlineEditing")
  const selection = useCoverStore((state) => state.selection)
  const editing = useCoverStore((state) => state.editing)

  return useMemo(() => {
    const { setSelection, setEditing, setField } = useCoverStore.getState()
    const chips = () => useCoverStore.getState().config.content.chips

    function write(field: EditableField, value: string, index = 0) {
      if (field !== "chips") return setField(`content.${field}`, value)
      const next = [...chips()]
      next[index] = value
      setField("content.chips", next)
    }

    return {
      selection,
      editing,
      select: setSelection,
      startEditing: () => setEditing(true),
      // Un texte vidé n'est pas écrit pendant la frappe : l'élément
      // disparaîtrait sous le curseur. La validation tranche.
      update: (field, value, index) => {
        if (value) write(field, value, index)
      },
      commit: (field, raw, initial, index = 0) => {
        setEditing(false)
        const value = raw.trim()
        if (value) return write(field, value, index)
        // Le nom est obligatoire : il reprend sa valeur d'origine.
        if (field === "nameMain") return write(field, initial)
        setSelection(null)
        if (field === "chips") {
          setField(
            "content.chips",
            chips().filter((_, position) => position !== index)
          )
        } else write(field, "")
      },
      maxLength: (field) => {
        const schema = template.schema.find(
          (item) => item.path === `content.${field}`
        )
        return schema && "maxLength" in schema ? schema.maxLength : undefined
      },
      label: (field, index = 0) =>
        field === "chips"
          ? t("chipLabel", { index: index + 1 })
          : tFields(LABELS[field]),
    }
  }, [selection, editing, template, t, tFields])
}

export type Frame = { left: number; top: number; width: number; height: number }

type Measure = { path: string; frame: Frame; viewport: DOMRect }

/**
 * Cadre du texte sélectionné, dessiné au-dessus de l'aperçu mais hors du nœud
 * exporté, et barre d'outils flottante. Enfant du conteneur de `CoverPreview`.
 */
export function SelectionLayer({ scale }: { scale: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const selection = useCoverStore((state) => state.selection)
  const editing = useCoverStore((state) => state.editing)
  const config = useCoverStore((state) => state.config)
  const [measure, setMeasure] = useState<Measure | null>(null)

  useEffect(() => {
    const layer = ref.current
    const root = layer?.parentElement
    if (!layer || !root || !selection) return
    const target = root.querySelector<HTMLElement>(
      `[data-edit-path="${selection.path}"]`
    )
    if (!target) return

    function update() {
      if (!layer || !target) return
      const box = layer.getBoundingClientRect()
      const viewport = target.getBoundingClientRect()
      setMeasure({
        path: selection!.path,
        viewport,
        frame: {
          left: viewport.left - box.left,
          top: viewport.top - box.top,
          width: viewport.width,
          height: viewport.height,
        },
      })
    }

    // Le texte change de taille en saisie ; il peut aussi bouger sans changer
    // de taille (contenu voisin modifié) : on remesure à chaque rendu du store.
    const observer = new ResizeObserver(update)
    observer.observe(target)
    const frame = requestAnimationFrame(update)
    window.addEventListener("resize", update)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", update)
    }
  }, [selection, editing, config, scale])

  const current = selection && measure?.path === selection.path ? measure : null
  const pad = 4

  return (
    <div
      ref={ref}
      aria-hidden={!current}
      className="pointer-events-none absolute inset-0"
    >
      {current && (
        <>
          <div
            className="absolute rounded-[3px] border-2 border-primary"
            style={{
              left: current.frame.left - pad,
              top: current.frame.top - pad,
              width: current.frame.width + pad * 2,
              height: current.frame.height + pad * 2,
            }}
          />
          {createPortal(
            <TextToolbar
              key={current.path}
              anchor={current.viewport}
              target={`[data-edit-path="${current.path}"]`}
            />,
            document.body
          )}
        </>
      )}
    </div>
  )
}
