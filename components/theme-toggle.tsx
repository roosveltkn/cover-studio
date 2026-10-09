"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n/provider"

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("landing")
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("toggleTheme")}
      title={t("toggleTheme")}
      className={className}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Icônes basculées en CSS : le thème n'est connu qu'après hydratation. */}
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  )
}
