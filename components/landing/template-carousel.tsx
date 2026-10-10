"use client"

import { Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

import { FitPreview } from "@/components/editor/fit-preview"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n/provider"
import { cn } from "@/lib/utils"
import { templates } from "@/templates/registry"
import type { CoverConfig } from "@/types/cover"

/** Durée d'affichage d'un modèle avant de passer au suivant. */
const INTERVAL = 3500

type TemplateCarouselProps = {
  /** Configuration d'aperçu (textes, couleur, captures) ; le modèle est celui de la diapositive. */
  config: CoverConfig
  picked?: string
  onPick: (id: string | undefined) => void
}

/**
 * Carrousel des modèles : un modèle à la fois, défilement automatique (en pause
 * au survol, au focus ou si l'utilisateur réduit les animations). Cliquer sur
 * une diapositive choisit le modèle, cliquer à nouveau l'annule.
 */
export function TemplateCarousel({ config, picked, onPick }: TemplateCarouselProps) {
  const t = useTranslations("landing")
  const tTemplates = useTranslations("templates")
  const count = templates.length
  const [index, setIndex] = useState(() =>
    Math.max(0, templates.findIndex((template) => template.id === picked))
  )
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const reducedMotion = useReducedMotion()
  const autoplay = playing && !hovered && !focused && !reducedMotion

  useEffect(() => {
    if (!autoplay) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), INTERVAL)
    return () => clearInterval(timer)
  }, [autoplay, count])

  const go = (step: number) => setIndex((current) => (current + step + count) % count)
  const current = templates[index]
  const currentPicked = picked === current.id

  function pick(id: string) {
    const next = picked === id ? undefined : id
    onPick(next)
    // Un modèle choisi reste affiché : le défilement s'arrête.
    if (next) setPlaying(false)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("carouselLabel")}
      className="flex flex-col gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg ring-1 ring-foreground/10"
        style={{ aspectRatio: `${current.size.width} / ${current.size.height}` }}
        aria-live={autoplay ? "off" : "polite"}
      >
        {/* Seuls la diapositive affichée et ses deux voisines sont rendues. */}
        {[-1, 0, 1].map((offset) => {
          const position = (index + offset + count) % count
          const template = templates[position]
          const selected = picked === template.id
          const name = tTemplates(template.nameKey)
          return (
            <div
              key={template.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideLabel", { position: position + 1, total: count })}
              aria-hidden={offset !== 0}
              inert={offset !== 0}
              className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${offset * 100}%)` }}
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-label={t("pickTemplate", { name })}
                onClick={() => pick(template.id)}
                className="group relative block size-full cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset"
              >
                <FitPreview template={template} config={{ ...config, template: template.id }} />
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-lg transition-shadow",
                    selected ? "ring-3 ring-primary ring-inset" : "group-hover:ring-2 group-hover:ring-primary/50 group-hover:ring-inset"
                  )}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm transition-opacity",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  )}
                >
                  {selected && <Check className="size-3.5" />}
                  {selected ? t("picked") : t("pickCta")}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {tTemplates(current.nameKey)}
            {currentPicked && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="size-3.5" />
                {t("picked")}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {tTemplates(current.descriptionKey)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {index + 1} / {count}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label={t("previousTemplate")} onClick={() => go(-1)}>
            <ChevronLeft />
          </Button>
          {!reducedMotion && (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={playing ? t("pauseCarousel") : t("playCarousel")}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
          )}
          <Button variant="outline" size="icon-sm" aria-label={t("nextTemplate")} onClick={() => go(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {picked
          ? t("pickedHint", { name: tTemplates(templates.find((template) => template.id === picked)!.nameKey) })
          : t("pickHint")}
      </p>
    </section>
  )
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** Préférence système « réduire les animations » : pas de défilement automatique. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    // Export statique : rendu serveur sans préférence connue.
    () => false
  )
}
