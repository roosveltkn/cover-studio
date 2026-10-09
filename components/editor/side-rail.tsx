"use client"

import { Download, Image, LayoutTemplate, Palette, Type, CaseSensitive, type LucideIcon } from "lucide-react"

import { useTranslations } from "@/i18n/provider"
import { cn } from "@/lib/utils"

import type { PanelId } from "./panels"

const ITEMS: { id: PanelId; label: `rail${Capitalize<PanelId>}`; icon: LucideIcon }[] = [
  { id: "templates", label: "railTemplates", icon: LayoutTemplate },
  { id: "content", label: "railContent", icon: Type },
  { id: "typography", label: "railTypography", icon: CaseSensitive },
  { id: "colors", label: "railColors", icon: Palette },
  { id: "mockups", label: "railMockups", icon: Image },
  { id: "export", label: "railExport", icon: Download },
]

type SideRailProps = {
  active: PanelId
  onSelect: (id: PanelId) => void
}

export function SideRail({ active, onSelect }: SideRailProps) {
  const t = useTranslations("editor")

  return (
    <nav
      aria-label={t("railLabel")}
      className="flex shrink-0 gap-1 overflow-x-auto border-b md:overflow-visible bg-[var(--rail)] p-2 md:w-[76px] md:flex-col md:border-r md:border-b-0"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const selected = id === active
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "group flex min-w-16 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:flex-none",
              selected ? "text-foreground" : "hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-lg transition-colors",
                selected
                  ? "bg-background text-primary shadow-sm ring-1 ring-foreground/10"
                  : "group-hover:bg-foreground/5"
              )}
            >
              <Icon className="size-5" />
            </span>
            {t(label)}
          </button>
        )
      })}
    </nav>
  )
}
