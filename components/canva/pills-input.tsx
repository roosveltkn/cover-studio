"use client"

import { X } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

type PillsInputProps = {
  id: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

/** Champ de pills : Entrée ajoute, × retire, Retour arrière sur champ vide retire la dernière. */
export function PillsInput({ id, value, onChange, placeholder }: PillsInputProps) {
  const [draft, setDraft] = useState("")

  function add() {
    const next = draft.trim()
    if (!next) return
    onChange([...value, next])
    setDraft("")
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      add()
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      {value.map((pill, index) => (
        <span
          key={`${pill}-${index}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-xs font-medium text-secondary-foreground"
        >
          <span className="truncate">{pill}</span>
          <button
            type="button"
            aria-label={`Retirer ${pill}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="grid size-5 place-items-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
