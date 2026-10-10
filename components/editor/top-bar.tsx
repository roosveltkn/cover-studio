"use client"

import { Download, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { GithubIcon } from "@/components/github-icon"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Logo } from "@/components/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "@/i18n/provider"
import { getExportSize } from "@/lib/export-sizes"
import { LINKS } from "@/lib/site"
import { useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"

import { ExportCard } from "./export-card"

export function TopBar() {
  const t = useTranslations("editor")
  const tTemplates = useTranslations("templates")
  const tSizes = useTranslations("exportSizes")
  const { resolvedTheme, setTheme } = useTheme()
  const template = getTemplate(useCoverStore((state) => state.config.template))
  const output = getExportSize(useCoverStore((state) => state.config.export.size))

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 sm:px-4">
      <Link
        href="/"
        aria-label={t("backHome")}
        className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Logo className="size-8" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">Cover Studio</span>
          <span className="truncate text-xs text-muted-foreground">
            {tTemplates(template.nameKey)} · {tSizes(output.labelKey)} {output.width} ×{" "}
            {output.height}
          </span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("githubAria")}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              />
            }
          >
            <GithubIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("githubTooltip")}</TooltipContent>
        </Tooltip>
        <LocaleSwitcher />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("toggleTheme")}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              />
            }
          >
            {/* Icônes basculées en CSS : le thème n'est connu qu'après hydratation. */}
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:block" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("themeTooltip")}</TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger
            render={
              <Button className="h-9 px-3 font-semibold" />
            }
          >
            <Download />
            {t("download")}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <ExportCard />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
