import { describe, expect, it, vi } from "vitest"

import {
  buildPages,
  discoverPages,
  humanizePath,
  normalizePageUrl,
  type DiscoverDeps,
} from "../lib/discover.js"
import type { CaptureError } from "../lib/errors.js"
import type { FetchResult } from "../lib/http.js"
import { readHome, type PageLink } from "../lib/links.js"

const site = new URL("https://www.monsite.com/")

const HOME_HTML = `<!doctype html>
<html lang="fr">
<head>
  <title>  Mon Site — accueil </title>
  <meta name="description" content="La meilleure app.">
  <meta name="theme-color" content="#4f46e5">
  <script>var html = '<a href="/script-link">x</a>'</script>
</head>
<body>
  <header>
    <a href="/"><img src="/logo.svg" alt="Accueil"></a>
    <nav>
      <a href="/features">Fonctionnalités</a>
      <a href="/pricing/">Tarifs</a>
      <a href="https://monsite.com/blog">Blog</a>
      <a href="/login">Connexion</a>
    </nav>
  </header>
  <main>
    <a href="/features#top">En savoir plus</a>
    <a href="/customers?utm_source=home">Nos clients</a>
    <a href="/integrations"><h3>Intégrations</h3><p>Connectez vos outils préférés.</p></a>
    <a href="/intake">Learn more→</a>
    <a href="/blog/lancement-v2">Lire la suite</a>
    <a href="/brochure.pdf">Brochure</a>
    <a href="https://ailleurs.com/">Partenaire</a>
    <a href="mailto:hello@monsite.com">Écrire</a>
    <a href="#faq">FAQ</a>
  </main>
  <footer>
    <a href="/mentions-legales">Mentions légales</a>
    <a href="/privacy">Confidentialité</a>
    <a href="/about">À propos</a>
  </footer>
</body>
</html>`

describe("readHome", () => {
  const { links, meta } = readHome(HOME_HTML, site)

  it("lit les métadonnées", () => {
    expect(meta).toEqual({
      title: "Mon Site — accueil",
      description: "La meilleure app.",
      themeColor: "#4f46e5",
      lang: "fr",
    })
  })

  it("classe les liens par zone et ignore scripts et ancres", () => {
    const byUrl = Object.fromEntries(links.map((link) => [link.url, link]))
    expect(byUrl["https://www.monsite.com/pricing/"]).toMatchObject({
      text: "Tarifs",
      area: "nav",
    })
    expect(byUrl["https://www.monsite.com/"]).toMatchObject({
      text: "Accueil",
      area: "nav",
    })
    expect(byUrl["https://www.monsite.com/about"]).toMatchObject({
      area: "footer",
    })
    expect(
      byUrl["https://www.monsite.com/customers?utm_source=home"]
    ).toMatchObject({
      area: "main",
    })
    expect(links.some((link) => link.url.includes("script-link"))).toBe(false)
    expect(links.some((link) => link.url.endsWith("#faq"))).toBe(false)
  })

  it("respecte <base href>", () => {
    const { links } = readHome(
      '<base href="/docs/"><a href="intro">Intro</a>',
      site
    )
    expect(links[0].url).toBe("https://www.monsite.com/docs/intro")
  })
})

describe("normalizePageUrl", () => {
  it.each([
    ["https://monsite.com/pricing/", "https://www.monsite.com/pricing"],
    ["/a//b/?x=1#y", "https://www.monsite.com/a/b"],
    ["/fr/index.html", "https://www.monsite.com/fr"],
    ["http://www.monsite.com/", "https://www.monsite.com/"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePageUrl(input, site)?.href).toBe(expected)
  })

  it.each([
    "https://ailleurs.com/",
    "https://sub.monsite.com/",
    "mailto:a@b.c",
    "/brochure.pdf",
    "/images/hero.webp",
    "/logout",
    "/login",
    "/wp-admin/edit.php",
    "/blog/page/2",
    "/blog/tag/react",
    "/account/settings",
  ])("exclut %s", (input) => {
    expect(normalizePageUrl(input, site)).toBeNull()
  })
})

describe("humanizePath", () => {
  it("rend un chemin lisible", () => {
    expect(humanizePath("/blog/mon-super_article.html")).toBe(
      "Mon super article"
    )
    expect(humanizePath("/caf%C3%A9")).toBe("Café")
    expect(humanizePath("/")).toBeNull()
  })
})

describe("buildPages", () => {
  const meta = { lang: "fr" }

  function build(links: PageLink[], sitemap: string[] = [], at = site) {
    return buildPages({ site: at, links, sitemap, meta, rendered: false })
  }

  it("groupe, libelle et ordonne les pages de l'accueil", () => {
    const { links } = readHome(HOME_HTML, site)
    const result = build(links, ["https://www.monsite.com/careers"])

    expect(result.site).toBe("https://www.monsite.com/")
    expect(
      result.pages.map((page) => [page.path, page.group, page.label])
    ).toEqual([
      ["/", "home", "Accueil"],
      ["/features", "navigation", "Fonctionnalités"],
      ["/pricing", "navigation", "Tarifs"],
      ["/blog", "navigation", "Blog"],
      ["/customers", "pages", "Nos clients"],
      ["/integrations", "pages", "Intégrations"],
      ["/intake", "pages", "Intake"],
      ["/about", "pages", "About"],
      ["/careers", "pages", "Careers"],
      ["/blog/lancement-v2", "blog", "Lancement v2"],
      ["/mentions-legales", "legal", "Mentions legales"],
      ["/privacy", "legal", "Privacy"],
    ])
    expect(result.total).toBe(12)
    expect(result.pages.find((page) => page.path === "/careers")?.source).toBe(
      "sitemap"
    )
  })

  it("ne classe en légal que des segments de chemin entiers", () => {
    const sitemap = [
      "/changelog/2023-08-30-mentions",
      "/docs/terms-update-summary",
      "/legal/aup",
      "/fr/politique-de-confidentialite",
      "/terms-of-service",
    ].map((path) => new URL(path, site).href)
    const groups = Object.fromEntries(
      build([], sitemap).pages.map((page) => [page.path, page.group])
    )
    expect(groups).toMatchObject({
      "/changelog/2023-08-30-mentions": "pages",
      "/docs/terms-update-summary": "pages",
      "/legal/aup": "legal",
      "/fr/politique-de-confidentialite": "legal",
      "/terms-of-service": "legal",
    })
  })

  it("donne un libellé null à l'accueil sans lien de navigation", () => {
    expect(build([]).pages).toEqual([
      {
        url: "https://www.monsite.com/",
        path: "/",
        label: null,
        group: "home",
        source: "link",
      },
    ])
  })

  it("garde la langue de l'accueil sur un site à préfixes", () => {
    const fr = new URL("https://www.monsite.com/fr")
    const links = [
      "/fr/tarifs",
      "/en/pricing",
      "/de/preise",
      "/fr/blog",
      "/",
    ].map((url): PageLink => ({
      url: new URL(url, site).href,
      text: "",
      area: "nav",
    }))
    const result = build(links, [], fr)
    expect(result.pages.map((page) => page.path)).toEqual([
      "/fr",
      "/fr/tarifs",
      "/fr/blog",
    ])
  })

  it("garde les pages sans préfixe quand la langue par défaut n'en a pas", () => {
    const links = ["/pricing", "/fr/tarifs", "/fr/contact"].map(
      (url): PageLink => ({
        url: new URL(url, site).href,
        text: "",
        area: "main",
      })
    )
    const result = buildPages({
      site,
      links,
      sitemap: [],
      meta: { lang: "en" },
      rendered: false,
    })
    expect(result.pages.map((page) => page.path)).toEqual(["/", "/pricing"])
  })

  it("ne prend pas un segment de deux lettres pour une langue", () => {
    const links = ["/go", "/ai/agents"].map((url): PageLink => ({
      url: new URL(url, site).href,
      text: "",
      area: "main",
    }))
    expect(build(links).pages.map((page) => page.path)).toEqual([
      "/",
      "/go",
      "/ai/agents",
    ])
  })

  it("plafonne le blog à 15 et le total à 50", () => {
    const sitemap = [
      ...Array.from(
        { length: 40 },
        (_, i) => `https://www.monsite.com/blog/article-${i}`
      ),
      ...Array.from(
        { length: 80 },
        (_, i) => `https://www.monsite.com/page-${i}`
      ),
    ]
    const result = build([], sitemap)
    expect(result.total).toBe(121)
    expect(result.pages).toHaveLength(50)
    expect(result.pages.filter((page) => page.group === "blog")).toHaveLength(
      15
    )
  })
})

describe("discoverPages", () => {
  const ok = (
    url: URL,
    body: string,
    contentType = "text/html; charset=utf-8"
  ): FetchResult => ({
    url,
    status: 200,
    contentType,
    body,
  })

  function deps(overrides: Partial<DiscoverDeps> = {}): DiscoverDeps {
    return {
      fetchText: vi.fn(async (url: URL) =>
        url.pathname === "/"
          ? ok(url, HOME_HTML)
          : { url, status: 404, contentType: "", body: "" }
      ),
      renderHtml: vi.fn(async () => {
        throw new Error("ne doit pas être appelé")
      }),
      ...overrides,
    }
  }

  async function codeOf(promise: Promise<unknown>) {
    try {
      await promise
    } catch (error) {
      return (error as CaptureError).code
    }
    return "ok"
  }

  it("se contente du HTML quand l'accueil a des liens", async () => {
    const d = deps()
    const result = await discoverPages(site, d)
    expect(result.pages.length).toBeGreaterThan(5)
    expect(result.meta.themeColor).toBe("#4f46e5")
    expect(d.renderHtml).not.toHaveBeenCalled()
  })

  it("rend la page avec Chrome quand c'est une SPA", async () => {
    const spa =
      '<html><body><div id="root"></div><script src="/app.js"></script></body></html>'
    const d = deps({
      fetchText: vi.fn(async (url: URL) =>
        url.pathname === "/"
          ? ok(url, spa)
          : { url, status: 404, contentType: "", body: "" }
      ),
      renderHtml: vi.fn(async (url: URL) => ({ url, body: HOME_HTML })),
    })
    const result = await discoverPages(site, d)
    expect(d.renderHtml).toHaveBeenCalledOnce()
    expect(result.pages.find((page) => page.path === "/pricing")?.source).toBe(
      "nav"
    )
    expect(
      result.pages.find((page) => page.path === "/customers")?.source
    ).toBe("render")
  })

  it("passe par Chrome quand le fetch est refusé", async () => {
    const d = deps({
      fetchText: vi.fn(async (url: URL) => ({
        url,
        status: 403,
        contentType: "text/html",
        body: "",
      })),
      renderHtml: vi.fn(async (url: URL) => ({ url, body: HOME_HTML })),
    })
    const result = await discoverPages(site, d)
    expect(result.pages.length).toBeGreaterThan(5)
  })

  it("signale un site injoignable ou qui n'est pas une page", async () => {
    const notFound = deps({
      fetchText: vi.fn(async (url: URL) => ({
        url,
        status: 500,
        contentType: "text/html",
        body: "",
      })),
    })
    expect(await codeOf(discoverPages(site, notFound))).toBe("unreachable")

    const pdf = deps({
      fetchText: vi.fn(async (url: URL) => ok(url, "%PDF", "application/pdf")),
    })
    expect(await codeOf(discoverPages(site, pdf))).toBe("no-pages")
  })
})
