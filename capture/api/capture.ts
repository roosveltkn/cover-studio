import { parseDevice } from "../lib/devices.js"
import { CaptureError } from "../lib/errors.js"
import { createHandler, withTimeout } from "../lib/handler.js"
import { parseLanguage } from "../lib/language.js"
import { capturePage } from "../lib/render.js"
import { assertPublicHost, parseTargetUrl } from "../lib/url-guard.js"

/** GET /api/capture?url=&device=&lang= : capture WebP, voir docs/CAPTURE.md. */
export default createHandler(async (requestUrl, headers) => {
  const target = parseTargetUrl(requestUrl.searchParams.get("url"))
  const device = parseDevice(requestUrl.searchParams.get("device"))
  if (!device) throw new CaptureError("invalid-device")
  const language = parseLanguage(requestUrl.searchParams.get("lang"))
  await assertPublicHost(target)

  const capture = await withTimeout(
    capturePage(target, device, language),
    45_000
  )
  headers.set("Content-Type", "image/webp")
  headers.set("X-Capture-Url", capture.url.href)
  headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600"
  )
  return new Response(Buffer.from(capture.image), { headers })
})
