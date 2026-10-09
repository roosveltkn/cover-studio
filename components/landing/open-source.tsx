"use client"

import { Bug, GitPullRequest, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { buttonVariants } from "@/components/ui/button"
import { useTranslations } from "@/i18n/provider"
import { LINKS } from "@/lib/site"
import { cn } from "@/lib/utils"

const POINTS: {
  icon: LucideIcon
  title: "osFreeTitle" | "osPrivateTitle" | "osContribTitle"
  text: "osFreeText" | "osPrivateText" | "osContribText"
}[] = [
  { icon: Sparkles, title: "osFreeTitle", text: "osFreeText" },
  { icon: ShieldCheck, title: "osPrivateTitle", text: "osPrivateText" },
  { icon: GitPullRequest, title: "osContribTitle", text: "osContribText" },
]

/** Présentation du projet open source, avec les liens vers le dépôt. */
export function OpenSourceSection() {
  const t = useTranslations("landing")

  return (
    <section aria-labelledby="open-source-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 id="open-source-title" className="text-2xl font-semibold tracking-tight">
          {t("openSourceTitle")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("openSourceText")}</p>
      </div>

      <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="flex flex-col gap-4 bg-background p-6"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{t(title)}</span>
              <span className="text-sm text-muted-foreground">{t(text)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <a
          href={LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
        >
          <GithubIcon className="size-4" />
          {t("viewOnGithub")}
        </a>
        <a
          href={LINKS.issues}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
        >
          <Bug className="size-4" />
          {t("reportIssue")}
        </a>
      </div>
    </section>
  )
}
