import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react"

import { fontStack } from "@/lib/fonts"
import type { EditableField, TextElement, TextSelection } from "@/types/cover"

import { TypographyContext } from "./typography"

/**
 * Édition directe sur l'aperçu (docs/INLINE-EDITING.md). Fourni par l'éditeur
 * pour l'aperçu principal uniquement : sans lui, les textes se rendent tels
 * quels (miniatures, export). Les templates n'accèdent jamais au store.
 */
export type EditingApi = {
  selection: TextSelection | null
  editing: boolean
  select: (selection: TextSelection) => void
  /** Passe le texte sélectionné en saisie. */
  startEditing: () => void
  /** Valeur saisie, à chaque frappe. */
  update: (field: EditableField, value: string, index?: number) => void
  /** Fin de saisie ; `initial` est la valeur à l'entrée en saisie. */
  commit: (
    field: EditableField,
    value: string,
    initial: string,
    index?: number
  ) => void
  maxLength: (field: EditableField) => number | undefined
  label: (field: EditableField, index?: number) => string
}

export const EditingContext = createContext<EditingApi | null>(null)

export function fieldElement(field: EditableField): TextElement {
  return field === "nameMain" || field === "nameAccent" ? "name" : field
}

export function fieldPath(field: EditableField, index?: number) {
  return field === "chips" ? `content.chips.${index ?? 0}` : `content.${field}`
}

/** Vrai quand l'élément est en cours de saisie (pour lever un rognage, par ex.). */
export function useIsEditing(element: TextElement) {
  const editing = useContext(EditingContext)
  return Boolean(editing?.editing && editing.selection?.element === element)
}

// Point cliqué pour entrer en saisie : lu par le span de saisie à son montage.
let pendingCaret: { x: number; y: number } | null = null

type EditableTextProps = {
  field: EditableField
  text: string
  /** Rang de la chip, pour `field="chips"`. */
  index?: number
  /** Faux pour l'accent du nom : il garde la couleur d'accent du template. */
  colorable?: boolean
}

/** Texte d'un champ de contenu, modifiable sur place quand l'éditeur le permet. */
export function EditableText({
  field,
  text,
  index,
  colorable = true,
}: EditableTextProps) {
  const editing = useContext(EditingContext)
  const typography = useContext(TypographyContext)
  const element = fieldElement(field)
  const font = typography?.textFont?.[element]
  const color = colorable ? typography?.textColor?.[element] : undefined
  const style: CSSProperties = {
    fontFamily: font ? fontStack(font) : undefined,
    color,
  }

  if (!editing)
    return font || color ? <span style={style}>{text}</span> : <>{text}</>

  const path = fieldPath(field, index)
  const selected = editing.selection?.path === path

  if (selected && editing.editing) {
    return (
      <ActiveText
        key="edit"
        path={path}
        initial={text}
        style={style}
        label={editing.label(field, index)}
        maxLength={editing.maxLength(field)}
        onInput={(value) => editing.update(field, value, index)}
        onCommit={(value, initial) =>
          editing.commit(field, value, initial, index)
        }
      />
    )
  }

  function enter(point?: { x: number; y: number }) {
    if (!editing) return
    if (!selected) editing.select({ element, path })
    pendingCaret = point ?? null
    editing.startEditing()
  }

  return (
    <span
      key="view"
      data-edit-path={path}
      data-editable=""
      data-selected={selected || undefined}
      role="button"
      tabIndex={0}
      aria-label={editing.label(field, index)}
      onClick={(event: MouseEvent) => {
        // Premier clic : sélection ; clic sur le texte déjà sélectionné : saisie.
        if (selected) enter({ x: event.clientX, y: event.clientY })
        else editing.select({ element, path })
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        enter()
      }}
      style={{ ...style, cursor: "text" }}
    >
      {text}
    </span>
  )
}

type ActiveTextProps = {
  path: string
  initial: string
  style: CSSProperties
  label: string
  maxLength?: number
  onInput: (value: string) => void
  onCommit: (value: string, initial: string) => void
}

/**
 * Span en saisie, non contrôlé par React : le texte est posé au montage et lu à
 * chaque frappe, sinon chaque rendu replacerait le curseur.
 */
function ActiveText({
  path,
  initial,
  style,
  label,
  maxLength,
  onInput,
  onCommit,
}: ActiveTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const committed = useRef(false)
  // Valeur à l'entrée en saisie : `initial` suit ensuite la frappe.
  const [start] = useState(initial)
  const [caret] = useState(() => pendingCaret)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.textContent = start
    element.focus({ preventScroll: true })
    placeCaret(element, caret)
    pendingCaret = null
    // Pas de validation au démontage : chaque frappe est déjà dans le store, et
    // StrictMode démonte puis remonte cet effet en développement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commit() {
    if (committed.current || !ref.current) return
    committed.current = true
    onCommit(ref.current.textContent ?? "", start)
  }

  return (
    <span
      ref={ref}
      data-edit-path={path}
      data-editing=""
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      aria-multiline={false}
      spellCheck={false}
      onInput={() => {
        const element = ref.current
        if (!element) return
        const raw = element.textContent ?? ""
        let value = raw.replace(/[\r\n]+/g, " ")
        if (maxLength && value.length > maxLength)
          value = value.slice(0, maxLength)
        if (value !== raw) {
          element.textContent = value
          placeCaret(element, null)
        }
        onInput(value)
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== "Escape") return
        event.preventDefault()
        // Échap ne doit pas aussi désélectionner : il quitte seulement la saisie.
        event.stopPropagation()
        ref.current?.blur()
      }}
      onBlur={commit}
      style={{
        ...style,
        cursor: "text",
        outline: "none",
        whiteSpace: "pre-wrap",
      }}
    />
  )
}

/** Place le curseur au point donné s'il tombe dans l'élément, sinon en fin de texte. */
function placeCaret(
  element: HTMLElement,
  point: { x: number; y: number } | null
) {
  const selection = window.getSelection()
  if (!selection) return
  let range: Range | null = null
  if (point) {
    if (typeof document.caretPositionFromPoint === "function") {
      const position = document.caretPositionFromPoint(point.x, point.y)
      if (position && element.contains(position.offsetNode)) {
        range = document.createRange()
        range.setStart(position.offsetNode, position.offset)
      }
    } else if (typeof document.caretRangeFromPoint === "function") {
      const found = document.caretRangeFromPoint(point.x, point.y)
      if (found && element.contains(found.startContainer)) range = found
    }
  }
  if (range) {
    range.collapse(true)
  } else {
    range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
  }
  selection.removeAllRanges()
  selection.addRange(range)
}
