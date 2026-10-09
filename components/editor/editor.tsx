"use client"

import { useEffect, useState } from "react"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "@/i18n/provider"
import { trackEditorOpened } from "@/lib/analytics"
import { hydrateCoverStore, useCoverStore } from "@/stores/cover-store"

import { CanvasStage } from "./canvas-stage"
import { Panel } from "./panels"
import { SideRail } from "./side-rail"
import { TopBar } from "./top-bar"

export function Editor() {
  const t = useTranslations("editor")
  const router = useRouter()
  const panel = useCoverStore((state) => state.activePanel)
  const setPanel = useCoverStore((state) => state.setActivePanel)
  // Les captures ne sont pas persistées : sans elles à l'arrivée (accès direct,
  // rechargement), on renvoie vers l'accueil. Ensuite, retirer toutes les
  // captures laisse l'éditeur ouvert, avec des emplacements vides.
  const [arrivedWithImage] = useState(
    () => useCoverStore.getState().config.mockups.images.length > 0
  )

  useEffect(() => {
    hydrateCoverStore()
  }, [])

  useEffect(() => {
    if (arrivedWithImage) trackEditorOpened()
  }, [arrivedWithImage])

  useEffect(() => {
    if (!arrivedWithImage) router.replace("/")
  }, [arrivedWithImage, router])

  if (!arrivedWithImage) return null

  return (
    <div className="flex h-svh flex-col bg-background">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Mobile : aperçu au-dessus, panneau en dessous (SPECS §9). */}
        <div className="order-1 flex aspect-[16/11] md:order-3 md:aspect-auto md:min-w-0 md:flex-1">
          <CanvasStage />
        </div>
        {/* En flex : le rail s'étire sur toute la hauteur de l'éditeur. */}
        <div className="order-2 md:order-1 md:flex">
          <SideRail active={panel} onSelect={setPanel} />
        </div>
        <aside
          aria-label={t("settingsLabel")}
          className="order-3 min-h-0 flex-1 overflow-y-auto bg-background md:order-2 md:w-[350px] md:flex-none md:border-r"
        >
          <Panel id={panel} />
        </aside>
      </div>
    </div>
  )
}
