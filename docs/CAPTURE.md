# URL capture service

The `capture/` service lists a site's pages and takes screenshots of them. It is a separate Vercel
project: the Cover Studio app stays a static export and only calls it when
`NEXT_PUBLIC_CAPTURE_ENDPOINT` is set. This document is the source of truth for both sides: the
service implements it and `lib/capture.ts` consumes it.

## Overview

```
App (static)                                  capture/ service (Vercel Functions)
────────────                                  ───────────────────────────────────
"Analyze"   ── GET /api/discover?url= ──▶     robots.txt → sitemaps → home page links
                                              → Chrome render for SPAs → JSON list
"Preview"   ── GET /api/capture?url=&device=desktop ──▶  headless Chrome → WebP
"Capture"   ── GET /api/capture?… (2 in parallel at most) ──▶  WebP
            ◀── image/webp, cached for 24 h by the Vercel CDN
```

The received image then goes through `readImage()` (`lib/image.ts`), exactly like an imported
file.

In the app, a run captures at most 4 images (pages × devices): 2 pages on desktop and mobile, or
up to 4 pages on a single device. The gallery itself holds 4 images (`MAX_IMAGES` in
`lib/slots.ts`).

## Endpoints

Both endpoints accept `GET` (and `OPTIONS` for the CORS preflight). Parameters go in the query
string, which lets the CDN cache responses per URL.

Optional common parameter: `lang` (`fr`, `en`, `pt-BR`…), the interface language. The service
forwards it to sites in `Accept-Language` (both fetch and Chrome), so that a multilingual site
serves the same language as the app. Missing or invalid value: English.

### `GET /api/discover?url=<address>&lang=<language>`

`200 application/json` response:

```ts
type DiscoverResponse = {
  /** Home page address, after redirects. */
  site: string
  /** Selected pages, in the suggested display order (50 at most). */
  pages: DiscoveredPage[]
  /** Number of pages found before capping. */
  total: number
  /** Home page metadata, to prefill the cover. */
  meta: {
    title?: string
    description?: string
    themeColor?: string
    lang?: string
  }
}

type DiscoveredPage = {
  url: string
  /** Display path: "/", "/pricing". */
  path: string
  /** Navigation link text, or humanised path; null for an unlabelled home page. */
  label: string | null
  group: "home" | "navigation" | "pages" | "blog" | "legal"
  source: "nav" | "link" | "sitemap" | "render"
}
```

Search order, from cheapest to most expensive:

1. Home page with a plain `fetch` (no browser): `<a href>` links to the same site. Links inside
   `<nav>` and `<header>` form the `navigation` group.
2. `robots.txt`: `Sitemap:` lines, otherwise `/sitemap.xml`. Sitemap indexes are followed
   (5 files and 1,000 URLs at most).
3. If the home page has fewer than 3 internal links (an SPA rendered in JS): Chrome render, then
   links are read from the DOM.

Clean-up: URLs without fragment or query string, trailing slash removed, deduplication, files
excluded (`.pdf`, images, feeds…), as well as login and admin pages, pagination and taxonomies.
When the site uses language prefixes (`/fr/…`, `/en/…`), only the home page's language is kept.
The `blog` group is capped at 15 entries.

CDN cache: `s-maxage=3600`.

### `GET /api/capture?url=<address>&device=desktop|mobile&lang=<language>`

| Device    | Viewport                       | Scale | Output image                            |
| --------- | ------------------------------ | ----- | --------------------------------------- |
| `desktop` | 1440×900                       | 2     | 2880×1800, landscape → browser frame    |
| `mobile`  | 390×844, touch, iPhone UA      | 3     | 1170×2532, portrait → phone frame       |

`200 image/webp` response. The `X-Capture-Url` header (exposed through CORS) gives the final
address after redirects.

Before the screenshot: `prefers-reduced-motion`, scrolling to trigger lazy loading, waiting for
fonts, and hiding cookie banners (scripts of common consent managers blocked, known selectors
hidden, fixed elements mentioning cookies removed).

CDN cache: `s-maxage=86400`.

### Errors

Every error returns JSON `{ "code": CaptureErrorCode }`, never cached:

| Code               | Status | When                                                                                   |
| ------------------ | ------ | -------------------------------------------------------------------------------------- |
| `invalid-url`      | 400    | Missing or malformed parameter, scheme other than http(s), unusual port, credentials   |
| `invalid-device`   | 400    | `device` missing or unknown                                                            |
| `forbidden-origin` | 403    | `Origin` header not in `ALLOWED_ORIGINS`                                               |
| `forbidden-host`   | 403    | The address (or a redirect) points to a private or local network                       |
| `no-pages`         | 404    | The address does not lead to an HTML page (PDF, image, API)                            |
| `blocked`          | 502    | The site refuses the robot (401, 403, 429, 503, challenge page)                        |
| `unreachable`      | 502    | DNS not found, connection refused, response too large, HTTP error                      |
| `timeout`          | 504    | The site takes too long to respond                                                     |
| `rate-limited`     | 429    | Set by the Vercel Firewall, not by the code                                            |
| `internal`         | 500    | Anything else (Chrome crash…)                                                          |

## Security

The service loads addresses supplied by anyone, which makes it an SSRF target.

- **Address filter** (`capture/lib/url-guard.ts`): only public `unicast` IP addresses are accepted
  (`127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `100.64/10`, `::1`, `fc00::/7`,
  IPv4-mapped, NAT64, 6to4… are refused). The names `localhost`, `*.localhost`, `*.local` and
  `*.internal` are refused without resolution.
- **`fetch` requests** (`capture/lib/http.ts`): the check happens **at connection time**, in the
  undici agent's `lookup`. A DNS answer that changes between the check and the connection
  (DNS rebinding) is therefore covered. Redirects are followed manually (5 at most) and
  re-validated.
- **Chrome**: every request made by the page (document, sub-resources, the page's own `fetch`
  calls) is intercepted and checked. Residual risk: Chrome resolves DNS itself after our check,
  so a very short rebinding window remains theoretically possible. WebSockets are not
  intercepted. The `@sparticuz/chromium` flags that disable the same-origin policy
  (`--disable-web-security`, `--allow-running-insecure-content`) are removed, as is
  `--single-process`, which crashes isolated browser contexts.
- **Limits**: 5 MB per `fetch` response, 8 s per request, 45 s per capture, 2,048 characters per
  URL.
- **Origins**: `ALLOWED_ORIGINS` restricts browser origins. It is not authentication (a script can
  forge the header): abuse protection comes from Vercel rate limiting.
- The service never returns page HTML, only link lists and images.

## Local development

`@sparticuz/chromium` is a Linux binary: on Windows and macOS, the service uses your installed
Chrome.

```bash
cp capture/.env.example capture/.env.local   # set CHROME_PATH
pnpm capture:dev                             # vercel dev on http://localhost:3001
pnpm capture:test
pnpm capture:typecheck
```

| Variable                       | Where      | Purpose                                                                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHROME_PATH`                  | local only | Path to the installed Chrome, e.g. `C:\Program Files\Google\Chrome\Application\chrome.exe`                                                      |
| `ALLOWED_ORIGINS`              | service    | Allowed origins, comma-separated. `*` is accepted in the subdomain (`https://cover-studio-*.vercel.app`). Empty: any origin (development only). |
| `NEXT_PUBLIC_CAPTURE_ENDPOINT` | app        | Service URL, without a trailing slash. Missing: the feature is hidden.                                                                          |

## Deploying on Vercel

1. **New project** imported from the same repository: Root Directory `capture`, Framework Preset
   _Other_, Node.js 22.x. Deployment Protection (Vercel Authentication) is turned off for this
   project: the service is public by design and protected by the rules below.
2. **Skipping useless builds**:
   - capture project: "Skip deployments when there are no changes to the root directory";
   - app project: Ignored Build Step
     `if git cat-file -e "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}^{commit}" 2>/dev/null; then git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- . ":!capture"; else exit 1; fi`.
     It compares against the last successful deployment, not just the last commit. Vercel makes
     a shallow clone: if that commit is missing from the clone, the command asks for a build
     (`exit 1`) instead of failing, which would fail the deployment.
3. **Domain**: for example `capture.<domain>` for production. Previews get their own
   `*.vercel.app` addresses; a stable one can be tied to the `develop` branch (the domain's
   "Git Branch" option).
4. **Variables**: `ALLOWED_ORIGINS` on the service; `NEXT_PUBLIC_CAPTURE_ENDPOINT` on the app,
   pointing previews to the service's `develop` preview and production to the production domain.
5. **Firewall → rate limiting rules** per IP: `/api/discover` 10 requests/min, `/api/capture`
   20 requests/min, 429 response.
6. **Spend Management** (Pro plan): spending alert and cap. On Hobby, the project is paused once
   quotas are reached.

`capture/vercel.json` sets the region (Paris, `cdg1`) and the functions' maximum duration (60 s).
Memory is not set there: it is ignored with Active CPU billing and is configured in the project
settings. There is no `includeFiles` either: with pnpm, the path to the Chromium binary is a
symlink that makes the function package invalid; automatic file tracing is enough.

## Known limitations

- Pages behind a login: not reachable.
- Sites protected against robots (Cloudflare challenge, captcha): `blocked` error.
- First call after a period of inactivity: 3 to 6 s longer (Chromium start-up).
