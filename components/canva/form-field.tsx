import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"

type FormFieldProps = {
  id: string
  label: string
  help?: string
  error?: string
  counter?: string
  children: ReactNode
}

/** Label → contrôle → aide ou erreur, espacés de 4 px (guideline Canva). */
export function FormField({ id, label, help, error, counter, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[13px] font-semibold">
          {label}
        </Label>
        {counter && (
          <span className="text-xs text-muted-foreground tabular-nums">{counter}</span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="text-xs text-muted-foreground">
            {help}
          </p>
        )
      )}
    </div>
  )
}
