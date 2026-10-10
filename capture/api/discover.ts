import { discoverPages } from "../lib/discover.js"
import { createHandler, withTimeout } from "../lib/handler.js"
import { fetchText } from "../lib/http.js"
import { parseLanguage } from "../lib/language.js"
import { renderHtml } from "../lib/render.js"
import { assertPublicHost, parseTargetUrl } from "../lib/url-guard.js"

/** GET /api/discover?url=&lang= : pages du site, voir docs/CAPTURE.md. */
export default createHandler(async (requestUrl, headers) => {
  const target = parseTargetUrl(requestUrl.searchParams.get("url"))
  const language = parseLanguage(requestUrl.searchParams.get("lang"))
  await assertPublicHost(target)

  // Toutes les requêtes de la découverte (accueil, sitemaps, rendu) dans la langue demandée.
  const result = await withTimeout(
    discoverPages(target, {
      fetchText: (url, options) => fetchText(url, { ...options, language }),
      renderHtml: (url) => renderHtml(url, language),
    }),
    40_000
  )
  headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=600"
  )
  return Response.json(result, { headers })
})
