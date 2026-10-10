import { XMLParser } from "fast-xml-parser"

import type { FetchText } from "./http.js"
import { parseTargetUrl } from "./url-guard.js"

const MAX_SITEMAP_FILES = 5
const MAX_SITEMAP_URLS = 1000

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  // Pas d'expansion d'entités : protège des « billion laughs ».
  processEntities: false,
  htmlEntities: false,
  isArray: (name) => name === "url" || name === "sitemap",
})

/** Adresses déclarées par les lignes « Sitemap: » de robots.txt. */
export function parseRobotsSitemaps(robots: string): string[] {
  return robots
    .split(/\r?\n/)
    .map((line) => /^\s*sitemap\s*:\s*(\S+)/i.exec(line)?.[1])
    .filter((value): value is string => Boolean(value))
}

type SitemapEntry = { loc?: unknown }

function locs(entries: unknown): string[] {
  if (!Array.isArray(entries)) return []
  return entries
    .map((entry: SitemapEntry) =>
      typeof entry?.loc === "string" ? entry.loc.trim() : ""
    )
    .filter(Boolean)
}

/** Lit un sitemap : pages (`urlset`) ou sitemaps enfants (`sitemapindex`). */
export function parseSitemap(xml: string): {
  pages: string[]
  sitemaps: string[]
} {
  const document = parser.parse(xml) as {
    urlset?: { url?: unknown }
    sitemapindex?: { sitemap?: unknown }
  }
  return {
    pages: locs(document.urlset?.url),
    sitemaps: locs(document.sitemapindex?.sitemap),
  }
}

/**
 * Dans un sitemap index, les pages passent avant les articles, produits et
 * taxonomies : on ne lit que quelques fichiers.
 */
function sitemapPriority(loc: string) {
  if (/page/i.test(loc)) return 0
  if (/post|blog|news|article|product|tag|categor|author/i.test(loc)) return 2
  return 1
}

/**
 * Adresses des pages listées par les sitemaps du site : celles de robots.txt,
 * sinon /sitemap.xml. Les échecs sont silencieux : le sitemap est un bonus.
 */
export async function collectSitemapUrls(
  site: URL,
  fetchText: FetchText
): Promise<string[]> {
  const robots = await fetchText(new URL("/robots.txt", site), {
    accept: "text/plain",
  }).catch(() => null)
  const declared =
    robots?.status === 200 ? parseRobotsSitemaps(robots.body) : []
  const queue =
    declared.length > 0 ? declared : [new URL("/sitemap.xml", site).href]

  const pages: string[] = []
  let files = 0
  while (
    queue.length > 0 &&
    files < MAX_SITEMAP_FILES &&
    pages.length < MAX_SITEMAP_URLS
  ) {
    const loc = queue.shift()!
    // Sitemaps compressés : non pris en charge, rares sur les petits sites.
    if (/\.gz$/i.test(loc)) continue
    let url: URL
    try {
      url = parseTargetUrl(loc)
    } catch {
      continue
    }
    files++
    const response = await fetchText(url, {
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    }).catch(() => null)
    if (response?.status !== 200) continue
    try {
      const sitemap = parseSitemap(response.body)
      pages.push(...sitemap.pages)
      queue.push(...sitemap.sitemaps)
      queue.sort((a, b) => sitemapPriority(a) - sitemapPriority(b))
    } catch {
      // XML invalide : fichier ignoré.
    }
  }
  return pages.slice(0, MAX_SITEMAP_URLS)
}
