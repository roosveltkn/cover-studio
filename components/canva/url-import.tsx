"use client"

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Globe,
  List,
  Loader2,
  Minus,
  Monitor,
  Plus,
  Search,
  Smartphone,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"

import { PagePreview } from "@/components/canva/page-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale, useTranslations } from "@/i18n/provider"
import type { MessageKey } from "@/i18n/translator"
import { pluralSuffix } from "@/i18n/translator"
import { trackUrlCaptured, trackUrlDiscovered } from "@/lib/analytics"
import {
  captureToFile,
  describeCaptureError,
  isAbortError,
  normalizeSiteUrl,
  type CaptureClient,
} from "@/lib/capture"
import { readImage } from "@/lib/image"
import { cn } from "@/lib/utils"
import type { CaptureDevice, DiscoveredPage, DiscoverResponse, PageGroup } from "@/types/capture"
import type { ImageAsset } from "@/types/cover"

const GROUP_KEYS: Record<PageGroup, MessageKey<"urlImport">> = {
  home: "groupHome",
  navigation: "groupNavigation",
  pages: "groupPages",
  blog: "groupBlog",
  legal: "groupLegal",
}
const GROUP_ORDER: PageGroup[] = ["home", "navigation", "pages", "blog", "legal"]
const DEVICES: CaptureDevice[] = ["desktop", "mobile"]
const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone } satisfies Record<
  CaptureDevice,
  unknown
>
/** Au-delà, un champ de filtre aide à retrouver une page. */
const FILTER_THRESHOLD = 8
/** Plafond réglable du nombre de captures lancées d'un coup. */
const MAX_PER_RUN = 5

type UrlImportProps = {
  /** Id du champ d'adresse : les libellés de la galerie pointent dessus. */
  id: string
  client: CaptureClient
  /** Places libres dans la galerie. */
  remaining: number
  onAdd: (images: ImageAsset[]) => void
}

/**
 * Captures depuis l'adresse d'un site : analyse, puis choix des pages et des
 * appareils dans une fenêtre (tiroir sur mobile), aperçu au clic, captures
 * ajoutées à la galerie au fil de l'eau. État local : une analyse perdue se
 * relance en un clic.
 */
export function UrlImport({ id, client, remaining, onAdd }: UrlImportProps) {
  const t = useTranslations("urlImport")
  const tErrors = useTranslations("errors")
  const locale = useLocale()
  const [address, setAddress] = useState("")
  const [discovering, setDiscovering] = useState(false)
  const [result, setResult] = useState<DiscoverResponse>()
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string>()
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  async function analyze() {
    let url: string
    try {
      url = normalizeSiteUrl(address)
    } catch (err) {
      setError(describeCaptureError(err, tErrors))
      return
    }
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setError(undefined)
    setDiscovering(true)
    try {
      const found = await client.discoverPages(url, { signal: current.signal, language: locale })
      trackUrlDiscovered({ pages: found.total })
      setResult(found)
      setOpen(true)
    } catch (err) {
      if (!isAbortError(err)) setError(describeCaptureError(err, tErrors))
    } finally {
      if (controller.current === current) setDiscovering(false)
    }
  }

  function cancel() {
    controller.current?.abort()
    setDiscovering(false)
  }

  const host = result && new URL(result.site).host.replace(/^www\./, "")
  const found =
    result &&
    t(`found${pluralSuffix(locale, result.total)}`, { count: result.total }) +
      (result.total > result.pages.length
        ? ` · ${t("truncated", { shown: result.pages.length })}`
        : "")

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Globe className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder={t("urlPlaceholder")}
            value={address}
            disabled={discovering || running}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-privacy`}
            className="pl-8"
            onChange={(event) => setAddress(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                analyze()
              }
            }}
          />
        </div>
        {discovering ? (
          <Button variant="outline" onClick={cancel}>
            <Loader2 className="animate-spin" />
            {t("cancel")}
          </Button>
        ) : (
          <Button onClick={analyze} disabled={!address.trim() || running}>
            {t("analyze")}
          </Button>
        )}
      </div>
      {discovering && (
        <p role="status" className="text-xs text-muted-foreground">
          {t("analyzing")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {result && !discovering && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <p className="min-w-0 flex-1 text-xs">
            <span className="block truncate font-medium">{host}</span>
            <span className="block text-muted-foreground">
              {running ? t("capturingShort") : found}
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {running ? <Loader2 className="animate-spin" /> : <List />}
            {t("openList")}
          </Button>
        </div>
      )}
      <p id={`${id}-privacy`} className="text-xs text-muted-foreground">
        {t("privacy")}
      </p>
      {result && (
        <ResponsiveDialog
          open={open}
          onOpenChange={setOpen}
          title={
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Globe className="size-4" />
              </span>
              <span className="truncate">{host}</span>
            </span>
          }
          description={found}
          closeLabel={t("close")}
          // Les captures continuent fenêtre fermée ; la sélection est retrouvée.
          keepMounted
        >
          <PagePicker
            key={result.site}
            client={client}
            result={result}
            remaining={remaining}
            onAdd={onAdd}
            onRunningChange={setRunning}
            onFinished={(failed) => {
              if (failed === 0) setOpen(false)
            }}
          />
        </ResponsiveDialog>
      )}
    </div>
  )
}

type Job = {
  key: string
  page: DiscoveredPage
  device: CaptureDevice
  status: "pending" | "done" | "error"
  message?: string
}

function PagePicker({
  client,
  result,
  remaining,
  onAdd,
  onRunningChange,
  onFinished,
}: {
  client: CaptureClient
  result: DiscoverResponse
  remaining: number
  onAdd: (images: ImageAsset[]) => void
  onRunningChange: (running: boolean) => void
  /** Fin d'une série de captures, avec le nombre d'échecs. */
  onFinished: (failed: number) => void
}) {
  const t = useTranslations("urlImport")
  const tErrors = useTranslations("errors")
  const locale = useLocale()
  const site = new URL(result.site)
  const [extra, setExtra] = useState<DiscoveredPage[]>([])
  const pages = useMemo(() => [...result.pages, ...extra], [result.pages, extra])
  const home = pages.find((page) => page.group === "home")
  const [selected, setSelected] = useState<Set<string>>(() => new Set(home ? [home.url] : []))
  const [devices, setDevices] = useState<CaptureDevice[]>(DEVICES)
  // Par défaut, de quoi remplir la galerie ; réglable de 1 à MAX_PER_RUN.
  const [limit, setLimit] = useState(() => Math.max(1, Math.min(remaining, MAX_PER_RUN)))
  const [query, setQuery] = useState("")
  const [addingPath, setAddingPath] = useState(false)
  const [path, setPath] = useState("")
  const [pathError, setPathError] = useState<string>()
  const [jobs, setJobs] = useState<Job[]>([])
  const [running, setRunning] = useState(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => onRunningChange(running), [running, onRunningChange])

  const labelOf = (page: DiscoveredPage) =>
    page.label ?? (page.group === "home" ? t("homeLabel") : page.path)

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? pages.filter((page) => `${labelOf(page)} ${page.path}`.toLowerCase().includes(needle))
    : pages
  const groups = GROUP_ORDER.map((group) => ({
    group,
    pages: visible.filter((page) => page.group === group),
  })).filter((entry) => entry.pages.length > 0)

  const chosen = pages.filter((page) => selected.has(page.url))
  const count = chosen.length * devices.length
  // Une page de plus doit tenir dans le plafond choisi.
  const full = (chosen.length + 1) * Math.max(devices.length, 1) > limit
  const overLimit = count > limit
  const overGallery = count > remaining
  const done = jobs.filter((job) => job.status !== "pending").length
  const added = jobs.filter((job) => job.status === "done").length
  const failed = jobs.filter((job) => job.status === "error").length

  function toggle(url: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  function addPath() {
    try {
      const url = normalizeSiteUrl(new URL(path.trim(), site).href)
      if (new URL(url).host !== site.host) throw new Error("hors du site")
      if (!pages.some((page) => page.url === url)) {
        const { pathname } = new URL(url)
        setExtra((current) => [
          ...current,
          { url, path: pathname, label: null, group: "pages", source: "link" },
        ])
      }
      if (!full) setSelected((current) => new Set(current).add(url))
      setPath("")
      setPathError(undefined)
      setAddingPath(false)
    } catch {
      setPathError(t("addPathInvalid"))
    }
  }

  async function capture() {
    const list: Job[] = chosen.flatMap((page) =>
      devices.map((device) => ({ key: `${device} ${page.url}`, page, device, status: "pending" }))
    )
    if (list.length === 0 || list.length > limit || list.length > remaining) return
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setJobs(list)
    setRunning(true)

    const update = (key: string, patch: Partial<Job>) =>
      setJobs((jobs) => jobs.map((job) => (job.key === key ? { ...job, ...patch } : job)))

    const outcomes = await Promise.all(
      list.map(async (job) => {
        try {
          const shot = await client.capturePage(job.page.url, job.device, {
            signal: current.signal,
            language: locale,
          })
          const image = await readImage(captureToFile(shot))
          if (current.signal.aborted) return "aborted"
          onAdd([image])
          update(job.key, { status: "done" })
          return "done"
        } catch (err) {
          if (isAbortError(err)) return "aborted"
          update(job.key, { status: "error", message: describeCaptureError(err, tErrors) })
          return "error"
        }
      })
    )
    if (controller.current !== current) return
    const failures = outcomes.filter((outcome) => outcome === "error").length
    trackUrlCaptured({
      count: outcomes.filter((outcome) => outcome === "done").length,
      failed: failures,
    })
    setRunning(false)
    setSelected(new Set())
    onFinished(failures)
  }

  function stop() {
    controller.current?.abort()
    // Détache la série annulée : sa fin ne doit ni mesurer ni vider la sélection.
    controller.current = null
    setRunning(false)
    setJobs((jobs) => jobs.filter((job) => job.status !== "pending"))
  }

  function onPathKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      addPath()
    }
    if (event.key === "Escape") {
      event.stopPropagation()
      setAddingPath(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-popover px-4 pt-3 pb-2">
          <p className="flex-1 text-sm font-medium">{t("pagesLabel")}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              overLimit ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}
          >
            {t("selectionSummary", { count, max: limit })}
          </span>
        </div>

        {pages.length > FILTER_THRESHOLD && (
          <div className="relative px-4 pb-2">
            <Search className="pointer-events-none absolute top-1/2 left-6.5 size-4 -translate-y-[calc(50%+4px)] text-muted-foreground" />
            <Input
              type="search"
              value={query}
              placeholder={t("filter")}
              aria-label={t("filter")}
              className="h-9 pl-8"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 px-4 pb-3">
          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              {t("noMatch")}
            </p>
          ) : (
            groups.map(({ group, pages }) => (
              <section key={group} className="flex flex-col gap-1">
                <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {t(GROUP_KEYS[group])}
                </h3>
                <ul className="flex flex-col gap-1">
                  {pages.map((page) => {
                    const checked = selected.has(page.url)
                    return (
                      <PageRow
                        key={page.url}
                        client={client}
                        page={page}
                        label={labelOf(page)}
                        checked={checked}
                        // Plafond atteint : on peut décocher, pas cocher.
                        disabled={running || (!checked && full)}
                        onToggle={() => toggle(page.url)}
                      />
                    )
                  })}
                </ul>
              </section>
            ))
          )}

          {addingPath ? (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={path}
                  placeholder={t("addPathPlaceholder")}
                  aria-label={t("addPathLabel")}
                  aria-invalid={Boolean(pathError)}
                  className="h-9"
                  onChange={(event) => setPath(event.target.value)}
                  onKeyDown={onPathKey}
                />
                <Button variant="outline" className="h-9" disabled={!path.trim()} onClick={addPath}>
                  {t("addPath")}
                </Button>
              </div>
              {pathError && (
                <p role="alert" className="text-xs text-destructive">
                  {pathError}
                </p>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground"
              disabled={running}
              onClick={() => setAddingPath(true)}
            >
              <Plus />
              {t("addPathLabel")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("devicesLabel")}</span>
            <ToggleGroup
              multiple
              variant="outline"
              spacing={0}
              value={devices}
              disabled={running}
              onValueChange={(next) =>
                setDevices(DEVICES.filter((device) => next.includes(device)))
              }
              className="w-full bg-background"
            >
              {DEVICES.map((device) => {
                const Icon = DEVICE_ICONS[device]
                return (
                  <ToggleGroupItem
                    key={device}
                    value={device}
                    className="h-9 flex-1 gap-1.5 data-[pressed]:bg-primary/10 data-[pressed]:text-primary"
                  >
                    <Icon />
                    {t(device)}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <span id="capture-limit-label" className="text-xs font-medium text-muted-foreground">
              {t("limitLabel")}
            </span>
            <div
              role="group"
              aria-labelledby="capture-limit-label"
              className="flex h-9 items-center rounded-lg border bg-background"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("decrease")}
                disabled={running || limit <= 1}
                onClick={() => setLimit((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </Button>
              <output
                aria-live="polite"
                className="w-8 text-center text-sm font-semibold tabular-nums"
              >
                {limit}
              </output>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("increase")}
                disabled={running || limit >= MAX_PER_RUN}
                onClick={() => setLimit((value) => Math.min(MAX_PER_RUN, value + 1))}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>

        {running ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <p role="status" className="flex-1 text-sm font-medium">
                {t("capturing", { done, count: jobs.length })}
              </p>
              <Button variant="outline" onClick={stop}>
                {t("cancel")}
              </Button>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.max(6, (done / jobs.length) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              {count === 0
                ? t("noSelection")
                : overLimit
                  ? t("overLimit", { count, max: limit })
                  : full
                    ? t("limitReached", { max: limit })
                    : t("hint")}
            </p>
            <Button
              size="lg"
              className="px-4"
              onClick={capture}
              disabled={count === 0 || overLimit || overGallery}
            >
              {t("captureCount", { count })}
            </Button>
          </div>
        )}

        {!running && overGallery && !overLimit && (
          <p role="alert" className="text-xs text-destructive">
            {t(`tooMany${pluralSuffix(locale, remaining)}`, { count: remaining })}
          </p>
        )}
        {!running && added > 0 && (
          <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="size-3.5" />
            {t(`done${pluralSuffix(locale, added)}`, { count: added })}
          </p>
        )}
        {jobs.length > 0 && (running || failed > 0) && (
          <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto">
            {jobs.map((job) => (
              <li key={job.key} className="flex items-start gap-2 text-xs">
                <JobIcon status={job.status} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {t("jobLabel", { page: labelOf(job.page), device: t(job.device) })}
                  </span>
                  {job.status === "error" ? (
                    <span className="block text-destructive">{job.message}</span>
                  ) : (
                    <span className="sr-only">
                      {job.status === "done" ? t("jobDone") : t("jobPending")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function JobIcon({ status }: { status: Job["status"] }) {
  if (status === "done") return <Check className="mt-px size-3.5 shrink-0 text-primary" />
  if (status === "error")
    return <AlertCircle className="mt-px size-3.5 shrink-0 text-destructive" />
  return <Loader2 className="mt-px size-3.5 shrink-0 animate-spin text-muted-foreground" />
}

function PageRow({
  client,
  page,
  label,
  checked,
  disabled,
  onToggle,
}: {
  client: CaptureClient
  page: DiscoveredPage
  label: string
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const t = useTranslations("urlImport")
  const [open, setOpen] = useState(false)
  const inputId = `page-${page.url}`

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border transition-colors",
        checked ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/60",
        disabled && !checked && "opacity-55"
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        />
        <label
          htmlFor={inputId}
          className={cn(
            "min-w-0 flex-1 py-0.5",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <span className="block truncate text-sm font-medium">{label}</span>
          {label !== page.path && (
            <span className="block truncate font-mono text-[11px] text-muted-foreground">
              {page.path}
            </span>
          )}
        </label>
        <Button
          variant={open ? "secondary" : "ghost"}
          size="sm"
          aria-expanded={open}
          aria-label={open ? t("previewHide", { page: label }) : t("previewShow", { page: label })}
          className="shrink-0 text-muted-foreground"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <EyeOff /> : <Eye />}
          <span className="hidden sm:inline">{t("preview")}</span>
        </Button>
      </div>
      {open && <PagePreview client={client} url={page.url} label={label} />}
    </li>
  )
}
