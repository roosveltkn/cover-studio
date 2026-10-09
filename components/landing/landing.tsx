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

import { FileInput } from "@/components/canva/file-input"
import { FitPreview } from "@/components/editor/fit-preview"
import { GithubIcon } from "@/components/github-icon"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "@/i18n/provider"
import { LINKS } from "@/lib/site"
import { isPortrait } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { hydrateCoverStore, useCoverStore } from "@/stores/cover-store"
import { getTemplate } from "@/templates/registry"
import { defaultConfig } from "@/templates/showcase/defaults"
import type { ImageAsset } from "@/types/cover"

import { Faq } from "./faq"
import { OpenSourceSection } from "./open-source"
import { SiteFooter } from "./site-footer"

// Textes dans le namespace `landing` : seules les icônes et les clés vivent ici.
const STEPS: { icon: LucideIcon; title: "step1Title" | "step2Title" | "step3Title"; text: "step1Text" | "step2Text" | "step3Text" }[] = [
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
  const [image, setImage] = useState<ImageAsset>()

  useEffect(() => {
    router.prefetch("/editor")
  }, [router])

  function start() {
    if (!image) return
    hydrateCoverStore()
    startFrom(image)
    router.push("/editor")
  }

  const base = defaultConfig(locale)
  const previewConfig = {
    ...base,
    template: image && isPortrait(image) ? "mobile-trio" : base.template,
    style: { brandColor: image?.dominant ?? base.style.brandColor },
    mockups: { ...base.mockups, images: image ? [image] : [] },
  }

  return (
    <div className="min-h-svh bg-[var(--rail)]">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <span className="grid size-9 place-items-center rounded-lg bg-[linear-gradient(135deg,#00c4cc,#7d2ae8)] text-white">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold">Cover Studio</span>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("githubAria")}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <GithubIcon className="size-4" />
            {t("github")}
          </a>
          <LocaleSwitcher />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16">
        <section className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#00c4cc_0%,#5a32fa_55%,#7d2ae8_100%)] p-6 pb-28 text-white sm:p-10 sm:pb-32">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                {t("heroTitle")}
              </h1>
              <p className="max-w-lg text-base text-white/85 sm:text-lg">{t("heroText")}</p>
            </div>
            <div className="overflow-hidden rounded-xl shadow-[0_24px_60px_rgba(20,0,60,0.35)] ring-1 ring-white/20">
              <FitPreview template={getTemplate(previewConfig.template)} config={previewConfig} />
            </div>
          </div>
        </section>

        <section
          id="start"
          aria-labelledby="start-title"
          className="-mt-20 mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl bg-background p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-foreground/5 sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="start-title" className="text-xl font-semibold tracking-tight">
              {t("startTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("startText")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="landing-image" className="text-[13px] font-semibold">
              {t("imageLabel")}
            </Label>
            <FileInput id="landing-image" value={image} onChange={setImage} />
          </div>
          <Button size="lg" className="h-11 w-full text-base" disabled={!image} onClick={start}>
            {t("createButton")}
            <ArrowRight data-icon="inline-end" />
          </Button>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {t(label)}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-title" className="flex flex-col gap-5">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight">
            {t("howTitle")}
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                className="flex flex-col gap-3 rounded-2xl bg-background p-5 ring-1 ring-foreground/5"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    {index + 1}. {t(title)}
                  </span>
                  <span className="text-sm text-muted-foreground">{t(text)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <OpenSourceSection />
        <Faq />
      </main>

      <SiteFooter />
    </div>
  )
}
