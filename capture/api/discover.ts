import { discoverPages } from "../lib/discover.js"
import { createHandler, withTimeout } from "../lib/handler.js"
import { fetchText } from "../lib/http.js"
import { renderHtml } from "../lib/render.js"
import { assertPublicHost, parseTargetUrl } from "../lib/url-guard.js"

/** GET /api/discover?url= : pages du site, voir docs/CAPTURE.md. */
export default createHandler(async (requestUrl, headers) => {
  const target = parseTargetUrl(requestUrl.searchParams.get("url"))
  await assertPublicHost(target)

  const result = await withTimeout(
    discoverPages(target, { fetchText, renderHtml }),
    40_000
  )
  headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=600"
  )
  return Response.json(result, { headers })
})
