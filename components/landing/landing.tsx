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
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { FileInput } from "@/components/canva/file-input"
import { CoverPreview } from "@/components/editor/cover-preview"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { hydrateCoverStore, useCoverStore } from "@/stores/cover-store"
import { showcase } from "@/templates/registry"
import { DEFAULT_CONFIG } from "@/templates/showcase/defaults"
import type { ImageAsset } from "@/types/cover"

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ImageUp,
    title: "Importez vos captures",
    text: "Une capture desktop, une capture mobile, ou les deux.",
  },
  {
    icon: Palette,
    title: "Personnalisez",
    text: "Nom, description, fonctionnalités et couleur de marque.",
  },
  {
    icon: Download,
    title: "Téléchargez",
    text: "Un PNG 2400 × 1500 prêt pour votre README, portfolio ou LinkedIn.",
  },
]

const PROMISES: { icon: LucideIcon; label: string }[] = [
  { icon: Lock, label: "Vos images restent dans votre navigateur" },
  { icon: UserX, label: "Sans compte" },
  { icon: Sparkles, label: "Gratuit et open source" },
]

export function Landing() {
  const router = useRouter()
  const startFrom = useCoverStore((state) => state.startFrom)
  const [desktop, setDesktop] = useState<ImageAsset>()
  const [mobile, setMobile] = useState<ImageAsset>()
  const ready = Boolean(desktop || mobile)

  useEffect(() => {
    router.prefetch("/editor")
  }, [router])

  function start() {
    hydrateCoverStore()
    startFrom({ desktop, mobile })
    router.push("/editor")
  }

  const brandColor = desktop?.dominant ?? mobile?.dominant ?? DEFAULT_CONFIG.style.brandColor
  const previewConfig = {
    ...DEFAULT_CONFIG,
    style: { brandColor },
    mockups: {
      ...DEFAULT_CONFIG.mockups,
      desktopImage: desktop,
      mobileImage: mobile,
      showDesktop: !ready || Boolean(desktop),
      showMobile: !ready || Boolean(mobile),
    },
  }

  return (
    <div className="min-h-svh bg-[var(--rail)]">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <span className="grid size-9 place-items-center rounded-lg bg-[linear-gradient(135deg,#00c4cc,#7d2ae8)] text-white">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold">Cover Studio</span>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16">
        <section className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#00c4cc_0%,#5a32fa_55%,#7d2ae8_100%)] p-6 pb-28 text-white sm:p-10 sm:pb-32">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                Une cover pro pour votre app, à partir de vos captures
              </h1>
              <p className="max-w-lg text-base text-white/85 sm:text-lg">
                Importez une capture de votre application : la mise en page, les mockups et
                les couleurs sont générés pour vous. Il ne reste qu&apos;à écrire le texte.
              </p>
            </div>
            <LivePreview config={previewConfig} />
          </div>
        </section>

        <section
          id="start"
          aria-labelledby="start-title"
          className="-mt-20 mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl bg-background p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-foreground/5 sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="start-title" className="text-xl font-semibold tracking-tight">
              Commencez par vos captures
            </h2>
            <p className="text-sm text-muted-foreground">
              Au moins une capture. La couleur de marque est déduite de votre interface.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="landing-desktop" className="text-[13px] font-semibold">
                Capture desktop
              </Label>
              <FileInput id="landing-desktop" value={desktop} onChange={setDesktop} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="landing-mobile" className="text-[13px] font-semibold">
                Capture mobile
              </Label>
              <FileInput id="landing-mobile" value={mobile} onChange={setMobile} />
            </div>
          </div>
          <Button size="lg" className="h-11 w-full text-base" disabled={!ready} onClick={start}>
            Créer ma cover
            <ArrowRight data-icon="inline-end" />
          </Button>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-title" className="flex flex-col gap-5">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight">
            Comment ça marche
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
                    {index + 1}. {title}
                  </span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}

/** Aperçu du template avec les captures importées, mis à l'échelle du conteneur. */
function LivePreview({ config }: { config: typeof DEFAULT_CONFIG }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / showcase.size.width)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="aspect-[16/10] w-full overflow-hidden rounded-xl shadow-[0_24px_60px_rgba(20,0,60,0.35)] ring-1 ring-white/20"
    >
      {scale > 0 && <CoverPreview template={showcase} config={config} scale={scale} />}
    </div>
  )
}
