import { CaptureError } from "./errors.js"

/**
 * Origines autorisées, lues dans ALLOWED_ORIGINS (séparées par des virgules).
 * « * » remplace un morceau de sous-domaine : https://cover-studio-*.vercel.app.
 * Vide : toutes les origines, pour le développement.
 */
function allowedPatterns(raw = process.env.ALLOWED_ORIGINS ?? "") {
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .map((origin) => {
      const source = origin.split("*").map(escapeRegExp).join("[a-z0-9-]+")
      return new RegExp(`^${source}$`, "i")
    })
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function isOriginAllowed(origin: string | null, raw?: string) {
  const patterns = allowedPatterns(raw)
  if (patterns.length === 0) return true
  // Sans en-tête Origin (curl, monitoring) : pas un navigateur, le rate limiting s'en charge.
  if (!origin) return true
  return patterns.some((pattern) => pattern.test(origin))
}

/** En-têtes CORS de la réponse ; lève forbidden-origin pour une origine refusée. */
export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin")
  if (!isOriginAllowed(origin)) throw new CaptureError("forbidden-origin")

  const headers = new Headers({ Vary: "Origin" })
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    headers.set("Access-Control-Expose-Headers", "X-Capture-Url")
    headers.set("Access-Control-Max-Age", "86400")
  }
  return headers
}
