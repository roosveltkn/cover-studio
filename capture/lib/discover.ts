import { CaptureError } from "./errors.js"
import type { FetchText } from "./http.js"
import { readHome, type HomeMeta, type PageLink } from "./links.js"
import { collectSitemapUrls } from "./sitemap.js"

export type PageGroup = "home" | "navigation" | "pages" | "blog" | "legal"
export type PageSource = "nav" | "link" | "sitemap" | "render"

export type DiscoveredPage = {
  url: string
  path: string
  label: string | null
  group: PageGroup
  source: PageSource
}

export type DiscoverResult = {
  site: string
  pages: DiscoveredPage[]
  total: number
  meta: HomeMeta
}

export type DiscoverDeps = {
  fetchText: FetchText
  renderHtml: (url: URL) => Promise<{ url: URL; body: string }>
}

const MAX_PAGES = 50
/** Plafond par groupe : un blog ou un méga-menu ne doit pas noyer le reste. */
const GROUP_LIMITS: Record<PageGroup, number> = {
  home: 1,
  navigation: 25,
  pages: MAX_PAGES,
  blog: 15,
  legal: 5,
}
const GROUP_ORDER: PageGroup[] = [
  "home",
  "navigation",
  "pages",
  "blog",
  "legal",
]
/** En dessous, la page d'accueil est sans doute rendue en JavaScript (SPA). */
const MIN_HTML_LINKS = 3
const BLOCKED_STATUSES = new Set([401, 403, 429, 503])

const EXCLUDED_EXTENSIONS =
  /\.(pdf|jpe?g|png|gif|svg|webp|avif|ico|zip|gz|rar|xml|json|txt|csv|mp3|mp4|webm|mov|css|js|rss|atom|docx?|xlsx?|pptx?|dmg|exe|apk)$/i
/** Connexion, administration, panier, compte, pagination et taxonomies. */
const EXCLUDED_PATHS =
  /(^|\/)(log-?out|sign-?out|deconnexion|log-?in|sign-?in|connexion|wp-admin|wp-login\.php|wp-json|xmlrpc\.php|cdn-cgi|admin|feed|cart|panier|checkout|my-account|mon-compte|account|tags?|author|category|categorie|page\/\d+)(\/|$)/i
/** Segment entier de chemin : « /changelog/…-mentions » n'est pas une page légale. */
const LEGAL_PATHS =
  /(^|\/)(mentions-legales|legal|legal-notice|privacy(-policy)?|privacidad|confidentialite|politique-de-confidentialite|cgu|cgv|terms(-of-(service|use))?|conditions-generales[\w-]*|cookies?(-policy)?|imprint|impressum|gdpr|rgpd|disclaimer|datenschutz)(\/|$)/i
/** Article d'une rubrique éditoriale ; l'index (/blog) reste une page. */
const BLOG_ARTICLE =
  /^\/(blog|news|actualites?|actus?|articles?|posts?|journal|insights|stories|magazine)\/.+/i
const LOCALE_PREFIX = /^\/([a-z]{2})(?:[-_][a-z]{2})?(?=\/|$)/i
const MAX_LABEL_LENGTH = 40
const GENERIC_LABELS =
  /^(en savoir plus|learn more|read more|lire (la suite|plus|l'article|le témoignage)|read (the )?(story|article)|voir (plus|tout)|see (more|all)|view all|d[ée]couvrir|discover|click here|cliquez ici|ici|here|[›»→>]+)$/i

const languageNames = new Intl.DisplayNames(["en"], {
  type: "language",
  fallback: "none",
})

/** « fr » et « en » sont des langues ; « go » ou « ai » ne le sont pas. */
function localeOf(path: string): string | undefined {
  const code = LOCALE_PREFIX.exec(path)?.[1]?.toLowerCase()
  if (!code) return undefined
  try {
    return languageNames.of(code) ? code : undefined
  } catch {
    return undefined
  }
}

function withoutLocale(path: string) {
  return localeOf(path) ? path.replace(LOCALE_PREFIX, "") || "/" : path
}

const stripWww = (hostname: string) => hostname.replace(/^www\./i, "")

/**
 * Normalise une adresse de page du site : même hôte (www ou non), sans
 * fragment ni query string, sans slash final. Null si elle sort du site ou
 * ne mène pas à une page.
 */
export function normalizePageUrl(raw: string, site: URL): URL | null {
  let url: URL
  try {
    url = new URL(raw, site)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (stripWww(url.hostname) !== stripWww(site.hostname)) return null

  url.protocol = site.protocol
  url.hostname = site.hostname
  url.port = site.port
  url.hash = ""
  url.search = ""
  url.pathname =
    url.pathname
      .replace(/\/{2,}/g, "/")
      .replace(/\/index\.(html?|php)$/i, "/")
      .replace(/(.)\/$/, "$1") || "/"

  if (EXCLUDED_EXTENSIONS.test(url.pathname)) return null
  if (EXCLUDED_PATHS.test(url.pathname)) return null
  return url
}

function readablePath(url: URL) {
  try {
    return decodeURI(url.pathname)
  } catch {
    return url.pathname
  }
}

/** « /blog/mon-super-article.html » → « Mon super article ». */
export function humanizePath(path: string): string | null {
  const segment = path.split("/").filter(Boolean).pop()
  if (!segment) return null
  let text = segment
  try {
    text = decodeURIComponent(segment)
  } catch {
    // Segment mal encodé : affiché tel quel.
  }
  text = text
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_+]+/g, " ")
    .trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null
}

/** Texte du lien s'il fait un bon libellé : court, sans flèche, pas un « En savoir plus ». */
function linkLabel(link: PageLink) {
  const text = link.text.replace(/[\s›»→>↗]+$/u, "").trim()
  if (!text || text.length > MAX_LABEL_LENGTH || GENERIC_LABELS.test(text))
    return null
  return text
}

type Candidate = {
  url: URL
  label: string | null
  source: PageSource
  order: number
}

/**
 * Assemble la liste finale à partir des liens de l'accueil et du sitemap :
 * dédoublonnage, filtre de langue, groupes, tri et plafonds.
 */
export function buildPages(input: {
  site: URL
  links: PageLink[]
  sitemap: string[]
  meta: HomeMeta
  rendered: boolean
}): DiscoverResult {
  const { site, links, sitemap, meta, rendered } = input
  const home = normalizePageUrl(site.href, site) ?? new URL("/", site)
  const candidates = new Map<string, Candidate>()
  let order = 0

  const isHome = (url: URL) => url.href === home.href || url.pathname === "/"
  const keyOf = (url: URL) => (isHome(url) ? home.href : url.href)
  candidates.set(home.href, {
    url: home,
    label: null,
    source: "link",
    order: order++,
  })

  for (const link of links) {
    const url = normalizePageUrl(link.url, site)
    if (!url) continue
    const key = keyOf(url)
    const label = linkLabel(link)
    const existing = candidates.get(key)
    if (existing) {
      // Un lien de navigation donne un meilleur libellé et un meilleur groupe.
      if (link.area === "nav" && existing.source !== "nav") {
        existing.source = "nav"
        existing.label = label ?? existing.label
        existing.order = order++
      } else if (!existing.label && label && link.area !== "footer") {
        existing.label = label
      }
      continue
    }
    candidates.set(key, {
      url,
      label: link.area === "footer" ? null : label,
      source: link.area === "nav" ? "nav" : rendered ? "render" : "link",
      order: order++,
    })
  }

  for (const loc of sitemap) {
    const url = normalizePageUrl(loc, site)
    if (!url) continue
    const key = keyOf(url)
    if (!candidates.has(key))
      candidates.set(key, {
        url,
        label: null,
        source: "sitemap",
        order: order++,
      })
  }

  const kept = filterLocale([...candidates.values()], home, meta)

  const groups = new Map<PageGroup, Candidate[]>(
    GROUP_ORDER.map((group) => [group, []])
  )
  for (const candidate of kept)
    groups.get(groupOf(candidate, home))!.push(candidate)

  // Liens de l'accueil dans leur ordre d'apparition, puis sitemap du moins
  // au plus profond.
  groups.get("pages")!.sort((a, b) => {
    const fromSitemap =
      Number(a.source === "sitemap") - Number(b.source === "sitemap")
    if (fromSitemap || a.source !== "sitemap")
      return fromSitemap || a.order - b.order
    return (
      depth(a.url) - depth(b.url) ||
      a.url.pathname.localeCompare(b.url.pathname)
    )
  })
  for (const group of ["home", "navigation", "blog"] as const)
    groups.get(group)!.sort((a, b) => a.order - b.order)
  groups
    .get("legal")!
    .sort((a, b) => a.url.pathname.localeCompare(b.url.pathname))

  for (const group of GROUP_ORDER)
    groups.set(group, groups.get(group)!.slice(0, GROUP_LIMITS[group]))
  // Les pages « ordinaires » cèdent la place pour tenir dans MAX_PAGES.
  const others = GROUP_ORDER.filter((group) => group !== "pages").reduce(
    (sum, group) => sum + groups.get(group)!.length,
    0
  )
  groups.set(
    "pages",
    groups.get("pages")!.slice(0, Math.max(0, MAX_PAGES - others))
  )

  const pages = GROUP_ORDER.flatMap((group) =>
    groups.get(group)!.map((candidate): DiscoveredPage => ({
      url: candidate.url.href,
      path: readablePath(candidate.url),
      label:
        candidate.label ??
        (group === "home" ? null : humanizePath(readablePath(candidate.url))),
      group,
      source: candidate.source,
    }))
  )

  return { site: home.href, pages, total: kept.length, meta }
}

function depth(url: URL) {
  return url.pathname.split("/").filter(Boolean).length
}

function groupOf(candidate: Candidate, home: URL): PageGroup {
  if (candidate.url.href === home.href) return "home"
  const path = withoutLocale(candidate.url.pathname)
  if (path === "/") return "home"
  if (LEGAL_PATHS.test(path)) return "legal"
  if (BLOG_ARTICLE.test(path)) return "blog"
  if (candidate.source === "nav") return "navigation"
  return "pages"
}

/**
 * Site multilingue à préfixes (/fr/…, /en/…) : on garde la langue de
 * l'accueil (préfixe de son adresse, sinon <html lang>) et les pages sans
 * préfixe. Sans langue identifiable, on garde les pages sans préfixe, ou
 * tout si aucune n'en est dépourvue.
 */
function filterLocale(candidates: Candidate[], home: URL, meta: HomeMeta) {
  const locales = new Set(
    candidates
      .map((candidate) => localeOf(candidate.url.pathname))
      .filter(Boolean)
  )
  if (locales.size === 0) return candidates

  const metaLocale = meta.lang?.slice(0, 2).toLowerCase()
  const preferred =
    localeOf(home.pathname) ??
    (metaLocale && locales.has(metaLocale) ? metaLocale : undefined)

  const unprefixed = candidates.filter(
    (candidate) =>
      !localeOf(candidate.url.pathname) && candidate.url.href !== home.href
  )
  if (!preferred && unprefixed.length === 0) return candidates

  return candidates.filter((candidate) => {
    if (candidate.url.href === home.href) return true
    const locale = localeOf(candidate.url.pathname)
    return !locale || locale === preferred
  })
}

/**
 * Découverte en trois temps, du moins au plus coûteux : HTML de l'accueil,
 * sitemaps, puis rendu Chrome si l'accueil n'expose presque aucun lien
 * (SPA) ou refuse le simple fetch.
 */
export async function discoverPages(
  input: URL,
  deps: DiscoverDeps
): Promise<DiscoverResult> {
  let page: { url: URL; body: string }
  let rendered = false

  const fetched = await deps.fetchText(input)
  if (BLOCKED_STATUSES.has(fetched.status)) {
    // Certains sites refusent le fetch mais servent un vrai navigateur.
    page = await deps.renderHtml(input)
    rendered = true
  } else if (fetched.status >= 400) {
    throw new CaptureError("unreachable")
  } else if (fetched.contentType && !/html/i.test(fetched.contentType)) {
    // Un PDF, une image ou une API JSON : rien à lister ni à capturer.
    throw new CaptureError("no-pages")
  } else {
    page = fetched
  }

  let { links, meta } = readHome(page.body, page.url)
  const site = page.url

  const internalCount = links.filter((link) =>
    normalizePageUrl(link.url, site)
  ).length
  const [sitemap, render] = await Promise.all([
    collectSitemapUrls(site, deps.fetchText),
    !rendered && internalCount < MIN_HTML_LINKS
      ? deps.renderHtml(site).catch(() => null)
      : Promise.resolve(null),
  ])
  if (render) {
    ;({ links, meta } = readHome(render.body, render.url))
    rendered = true
  }

  return buildPages({ site, links, sitemap, meta, rendered })
}
