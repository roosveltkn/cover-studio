"use client"

import {
  ArrowRight,
  Download,
  ImageUp,
  Lock,
  Palette,
  Sparkles,
  UserX,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import { ImageGallery } from "@/components/canva/image-gallery"
import { GithubIcon } from "@/components/github-icon"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "@/i18n/provider"
import { trackScreenshotImported, trackTemplateSelected } from "@/lib/analytics"
import { LINKS } from "@/lib/site"
import { MAX_IMAGES, isPortrait } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { hydrateCoverStore, useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"
import { defaultConfig } from "@/templates/showcase/defaults"
import type { ImageAsset } from "@/types/cover"

import { Faq } from "./faq"
import { OpenSourceSection } from "./open-source"
import { SiteFooter } from "./site-footer"
import { TemplateCarousel } from "./template-carousel"

// Textes dans le namespace `landing` : seules les icônes et les clés vivent ici.
const STEPS: {
  icon: LucideIcon
  title: "step1Title" | "step2Title" | "step3Title"
  text: "step1Text" | "step2Text" | "step3Text"
}[] = [
  { icon: ImageUp, title: "step1Title", text: "step1Text" },
  { icon: Palette, title: "step2Title", text: "step2Text" },
  { icon: Download, title: "step3Title", text: "step3Text" },
]

const PROMISES: { icon: LucideIcon; label: "promiseLocal" | "promiseNoAccount" | "promiseFree" }[] = [
  { icon: Lock, label: "promiseLocal" },
  { icon: UserX, label: "promiseNoAccount" },
  { icon: Sparkles, label: "promiseFree" },
]

export function Landing() {
  const t = useTranslations("landing")
  const locale = useLocale()
  const router = useRouter()
  const startFrom = useCoverStore((state) => state.startFrom)
  const [images, setImages] = useState<ImageAsset[]>([])
  const [picked, setPicked] = useState<string>()

  useEffect(() => {
    router.prefetch("/editor")
  }, [router])

  function updateImages(next: ImageAsset[]) {
    const known = new Set(images.map((image) => image.id))
    for (const image of next) {
      if (!known.has(image.id)) {
        trackScreenshotImported({
          orientation: isPortrait(image) ? "portrait" : "landscape",
        })
      }
    }
    setImages(next)
  }

  function start() {
    if (images.length === 0) return
    hydrateCoverStore()
    startFrom(images, { template: picked })
    router.push("/editor")
  }

  const base = defaultConfig(locale)
  const previewConfig = {
    ...base,
    style: { brandColor: images[0]?.dominant ?? base.style.brandColor },
    mockups: { ...base.mockups, images },
  }

  // Les libellés d'emplacement suivent le modèle qui sera ouvert dans l'éditeur.
  const slotsTemplate = getTemplate(
    picked ??
      (images.length > 0 && images.every(isPortrait)
        ? "mobile-trio"
        : "showcase")
  )

  function pickTemplate(id: string | undefined) {
    setPicked(id)
    if (id) trackTemplateSelected({ template: id })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Logo className="size-8" />
          <span className="font-semibold tracking-tight">Cover Studio</span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("githubAria")}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5"
              )}
            >
              <GithubIcon className="size-4" />
              {t("github")}
            </a>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent),radial-gradient(40%_40%_at_0%_100%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:py-20">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-lg text-base text-muted-foreground">
                  {t("heroText")}
                </p>
              </div>

              <section
                id="start"
                aria-labelledby="start-title"
                className="flex flex-col gap-5 rounded-2xl border border-primary/25 bg-background p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_color-mix(in_oklab,var(--primary)_35%,transparent)] sm:p-6"
              >
                <div className="flex flex-col gap-1">
                  <h2
                    id="start-title"
                    className="text-xl font-semibold tracking-tight"
                  >
                    {t("startTitle")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("startText")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="landing-image"
                    className="text-[13px] font-semibold"
                  >
                    {t("imageLabel", { max: MAX_IMAGES })}
                  </Label>
                  <ImageGallery
                    id="landing-image"
                    images={images}
                    slots={slotsTemplate.slots}
                    onChange={updateImages}
                  />
                </div>
                <Button
                  size="lg"
                  className="h-11 w-full text-base"
                  disabled={images.length === 0}
                  onClick={start}
                >
                  {t("createButton")}
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  {PROMISES.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <Icon className="size-3.5 text-primary" />
                      {t(label)}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="rounded-2xl border border-border bg-muted/50 p-2 shadow-sm sm:p-3">
              <TemplateCarousel
                config={previewConfig}
                picked={picked}
                onPick={pickTemplate}
              />
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-16">
          <section aria-labelledby="how-title" className="flex flex-col gap-8">
            <h2
              id="how-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {t("howTitle")}
            </h2>
            <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  className="flex flex-col gap-4 bg-background p-6"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="size-5 text-primary" />
                  </span>
                  <span className="flex flex-col gap-1.5">
                    <span className="font-semibold">{t(title)}</span>
                    <span className="text-sm text-muted-foreground">
                      {t(text)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <OpenSourceSection />
          <Faq />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
