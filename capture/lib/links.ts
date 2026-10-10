import { parse } from "node-html-parser"

/** Zone de la page où se trouve le lien : la navigation donne les meilleures pages. */
export type LinkArea = "nav" | "main" | "footer"

export type PageLink = {
  /** Adresse absolue, telle que résolue depuis le href. */
  url: string
  text: string
  area: LinkArea
}

export type HomeMeta = {
  title?: string
  description?: string
  themeColor?: string
  lang?: string
}

const NAV_SELECTOR = "nav, header, [role=navigation]"

function clean(text: string | undefined) {
  const value = text?.replace(/\s+/g, " ").trim()
  return value || undefined
}

/**
 * Lit la page d'accueil : liens (avec leur zone et leur texte) et métadonnées.
 * Le contenu des <script> et <style> est ignoré.
 */
export function readHome(
  html: string,
  pageUrl: URL
): { links: PageLink[]; meta: HomeMeta } {
  const root = parse(html, {
    blockTextElements: { script: false, style: false, noscript: false },
  })

  let base = pageUrl
  const baseHref = root.querySelector("base[href]")?.getAttribute("href")
  if (baseHref) {
    try {
      base = new URL(baseHref, pageUrl)
    } catch {
      // <base> invalide : on garde l'adresse de la page.
    }
  }

  const links: PageLink[] = []
  for (const anchor of root.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href")?.trim()
    if (!href || href.startsWith("#")) continue
    let url: URL
    try {
      url = new URL(href, base)
    } catch {
      continue
    }
    // Une carte cliquable contient titre et description : on garde la première
    // ligne (titre), pas tout le texte collé.
    const firstLine = anchor.structuredText
      .split("\n")
      .find((line) => line.trim())
    const text =
      clean(firstLine) ??
      clean(anchor.getAttribute("aria-label")) ??
      clean(anchor.getAttribute("title")) ??
      clean(anchor.querySelector("img[alt]")?.getAttribute("alt")) ??
      ""
    const area: LinkArea = anchor.closest(NAV_SELECTOR)
      ? "nav"
      : anchor.closest("footer")
        ? "footer"
        : "main"
    links.push({ url: url.href, text, area })
  }

  const metaContent = (name: string) =>
    clean(root.querySelector(`meta[name="${name}"]`)?.getAttribute("content"))

  return {
    links,
    meta: {
      title: clean(root.querySelector("title")?.text),
      description: metaContent("description"),
      themeColor: metaContent("theme-color"),
      lang: clean(root.querySelector("html")?.getAttribute("lang")),
    },
  }
}
