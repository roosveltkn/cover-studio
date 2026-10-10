"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"
import { cn } from "cn"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"

type ResponsiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Libellé accessible du bouton de fermeture. */
  closeLabel: string
  children: React.ReactNode
  /**
   * Garde le contenu monté une fois fermé : un travail en cours (captures)
   * continue et l'état est retrouvé à la réouverture.
   */
  keepMounted?: boolean
  className?: string
}

const BACKDROP =
  "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 supports-backdrop-filter:backdrop-blur-xs"

/**
 * Fenêtre modale centrée sur ordinateur, tiroir qui monte du bas sur mobile
 * (glisser vers le bas pour fermer). Le contenu est le même dans les deux cas :
 * le corps défile, l'en-tête reste visible.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  keepMounted,
  className,
}: ResponsiveDialogProps) {
  const desktop = useMediaQuery("(min-width: 640px)")

  if (desktop)
    return (
      <DialogPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
        <DialogPrimitive.Portal keepMounted={keepMounted}>
          <DialogPrimitive.Backdrop className={BACKDROP} />
          <DialogPrimitive.Popup
            className={cn(
              "fixed top-1/2 left-1/2 z-50 flex max-h-[min(44rem,calc(100dvh-4rem))] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 transition-[opacity,scale] duration-200 outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              className
            )}
          >
            <Header
              title={
                <DialogPrimitive.Title className="text-base font-semibold">
                  {title}
                </DialogPrimitive.Title>
              }
              description={
                description && (
                  <DialogPrimitive.Description className="text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )
              }
              close={
                <DialogPrimitive.Close
                  render={<Button variant="ghost" size="icon-sm" aria-label={closeLabel} />}
                >
                  <XIcon />
                </DialogPrimitive.Close>
              }
            />
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DrawerPrimitive.Portal keepMounted={keepMounted}>
        <DrawerPrimitive.Backdrop
          className={cn(
            BACKDROP,
            "opacity-[calc(1-var(--drawer-swipe-progress,0))] data-[swiping]:duration-0"
          )}
        />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end">
          <DrawerPrimitive.Popup
            className={cn(
              "flex max-h-[88dvh] w-full translate-y-[var(--drawer-swipe-movement-y,0px)] flex-col rounded-t-2xl bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-xl ring-1 ring-foreground/10 transition-transform duration-300 ease-out outline-none data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:duration-0",
              className
            )}
          >
            <div
              aria-hidden
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            />
            <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
              <Header
                title={
                  <DrawerPrimitive.Title className="text-base font-semibold">
                    {title}
                  </DrawerPrimitive.Title>
                }
                description={
                  description && (
                    <DrawerPrimitive.Description className="text-sm text-muted-foreground">
                      {description}
                    </DrawerPrimitive.Description>
                  )
                }
                close={
                  <DrawerPrimitive.Close
                    render={<Button variant="ghost" size="icon-sm" aria-label={closeLabel} />}
                  >
                    <XIcon />
                  </DrawerPrimitive.Close>
                }
              />
              {children}
            </DrawerPrimitive.Content>
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

function Header({
  title,
  description,
  close,
}: {
  title: React.ReactNode
  description: React.ReactNode
  close: React.ReactNode
}) {
  return (
    <div className="flex shrink-0 items-start gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title}
        {description}
      </div>
      {close}
    </div>
  )
}
