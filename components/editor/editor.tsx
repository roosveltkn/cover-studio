"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { hydrateCoverStore, useCoverStore } from "@/stores/cover-store"

import { CanvasStage } from "./canvas-stage"
import { Panel, type PanelId } from "./panels"
import { SideRail } from "./side-rail"
import { TopBar } from "./top-bar"

export function Editor() {
  const router = useRouter()
  const [panel, setPanel] = useState<PanelId>("content")
  const hasImage = useCoverStore(
    (state) => Boolean(state.config.mockups.desktopImage || state.config.mockups.mobileImage)
  )

  useEffect(() => {
    hydrateCoverStore()
  }, [])

  // Les captures ne sont pas persistées : sans elles (accès direct, rechargement),
  // on renvoie vers l'accueil pour en importer.
  useEffect(() => {
    if (!hasImage) router.replace("/")
    // Vérifié à l'arrivée seulement : retirer une capture ensuite reste permis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasImage) return null

  return (
    <div className="flex h-svh flex-col bg-background">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Mobile : aperçu au-dessus, panneau en dessous (SPECS §9). */}
        <div className="order-1 flex aspect-[16/11] md:order-3 md:aspect-auto md:min-w-0 md:flex-1">
          <CanvasStage />
        </div>
        <div className="order-2 md:order-1">
          <SideRail active={panel} onSelect={setPanel} />
        </div>
        <aside
          aria-label="Réglages"
          className="order-3 min-h-0 flex-1 overflow-y-auto bg-background md:order-2 md:w-[350px] md:flex-none md:border-r"
        >
          <Panel id={panel} />
        </aside>
      </div>
    </div>
  )
}
