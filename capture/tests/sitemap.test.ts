import { describe, expect, it } from "vitest"

import type { FetchResult, FetchText } from "../lib/http.js"
import {
  collectSitemapUrls,
  parseRobotsSitemaps,
  parseSitemap,
} from "../lib/sitemap.js"

function fakeFetch(
  files: Record<string, string>
): FetchText & { calls: string[] } {
  const calls: string[] = []
  const fetchText = async (url: URL): Promise<FetchResult> => {
    calls.push(url.href)
    const body = files[url.href]
    return {
      url,
      status: body === undefined ? 404 : 200,
      contentType: "text/xml",
      body: body ?? "",
    }
  }
  return Object.assign(fetchText, { calls })
}

const urlset = (...locs: string[]) =>
  `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((loc) => `<url><loc>${loc}</loc></url>`)
    .join("")}</urlset>`

const index = (...locs: string[]) =>
  `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
    .join("")}</sitemapindex>`

describe("parseRobotsSitemaps", () => {
  it("lit les lignes Sitemap quelle que soit la casse", () => {
    const robots =
      "User-agent: *\nDisallow: /admin\nSitemap: https://a.com/s1.xml\r\nsitemap:https://a.com/s2.xml"
    expect(parseRobotsSitemaps(robots)).toEqual([
      "https://a.com/s1.xml",
      "https://a.com/s2.xml",
    ])
  })
})

describe("parseSitemap", () => {
  it("lit un urlset, même avec une seule entrée", () => {
    expect(parseSitemap(urlset("https://a.com/")).pages).toEqual([
      "https://a.com/",
    ])
    expect(
      parseSitemap(urlset(" https://a.com/x ", "https://a.com/y")).pages
    ).toEqual(["https://a.com/x", "https://a.com/y"])
  })

  it("lit un sitemap index", () => {
    expect(parseSitemap(index("https://a.com/pages.xml")).sitemaps).toEqual([
      "https://a.com/pages.xml",
    ])
  })

  it("n'étend pas les entités", () => {
    const xml = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaaaaaaaa">]><urlset><url><loc>https://a.com/&a;</loc></url></urlset>`
    expect(parseSitemap(xml).pages[0]).not.toContain("aaaaaaaaaa")
  })
})

describe("collectSitemapUrls", () => {
  const site = new URL("https://a.com/")

  it("suit robots.txt puis l'index, pages en priorité", async () => {
    const fetchText = fakeFetch({
      "https://a.com/robots.txt": "Sitemap: https://a.com/index.xml",
      "https://a.com/index.xml": index(
        "https://a.com/post-sitemap.xml",
        "https://a.com/page-sitemap.xml"
      ),
      "https://a.com/page-sitemap.xml": urlset("https://a.com/about"),
      "https://a.com/post-sitemap.xml": urlset("https://a.com/blog/hello"),
    })
    expect(await collectSitemapUrls(site, fetchText)).toEqual([
      "https://a.com/about",
      "https://a.com/blog/hello",
    ])
    expect(
      fetchText.calls.indexOf("https://a.com/page-sitemap.xml")
    ).toBeLessThan(fetchText.calls.indexOf("https://a.com/post-sitemap.xml"))
  })

  it("se rabat sur /sitemap.xml sans robots.txt", async () => {
    const fetchText = fakeFetch({
      "https://a.com/sitemap.xml": urlset("https://a.com/pricing"),
    })
    expect(await collectSitemapUrls(site, fetchText)).toEqual([
      "https://a.com/pricing",
    ])
  })

  it("ignore les sitemaps vers des hôtes interdits et les fichiers .gz", async () => {
    const fetchText = fakeFetch({
      "https://a.com/robots.txt":
        "Sitemap: http://127.0.0.1/s.xml\nSitemap: https://a.com/s.xml.gz",
    })
    expect(await collectSitemapUrls(site, fetchText)).toEqual([])
    expect(fetchText.calls).toEqual(["https://a.com/robots.txt"])
  })

  it("ne lit pas plus de 5 fichiers", async () => {
    const children = Array.from(
      { length: 10 },
      (_, i) => `https://a.com/s${i}.xml`
    )
    const files: Record<string, string> = {
      "https://a.com/sitemap.xml": index(...children),
    }
    for (const child of children)
      files[child] = urlset(child.replace(".xml", ""))
    const fetchText = fakeFetch(files)
    await collectSitemapUrls(site, fetchText)
    expect(
      fetchText.calls.filter((call) => call.endsWith(".xml"))
    ).toHaveLength(5)
  })

  it("reste silencieux quand tout échoue", async () => {
    const failing: FetchText = async () => {
      throw new Error("réseau")
    }
    expect(await collectSitemapUrls(site, failing)).toEqual([])
  })
})
