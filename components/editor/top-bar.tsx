"use client"

import { Download, Moon, Sparkles, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

import { ExportCard } from "./export-card"

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme()
  const template = getTemplate(useCoverStore((state) => state.config.template))

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-[linear-gradient(90deg,#00c4cc_0%,#6b43e8_55%,#7d2ae8_100%)] px-3 text-white sm:px-4">
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-white/60"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/20">
          <Sparkles className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">Cover Studio</span>
          <span className="truncate text-xs text-white/80">
            {template.name} · {template.size.width} × {template.size.height}
          </span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Changer de thème"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-white hover:bg-white/15 hover:text-white"
              />
            }
          >
            {/* Icônes basculées en CSS : le thème n'est connu qu'après hydratation. */}
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:block" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Thème (D)</TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger
            render={
              <Button className="h-9 bg-white px-3 font-semibold text-[#3d2a8c] hover:bg-white/90" />
            }
          >
            <Download />
            Télécharger
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <ExportCard />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
