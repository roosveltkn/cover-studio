/**
 * Codes d'erreur du contrat d'API (docs/CAPTURE.md). L'app les traduit ;
 * le service ne renvoie jamais de message destiné à l'utilisateur.
 */
export type CaptureErrorCode =
  | "invalid-url"
  | "invalid-device"
  | "forbidden-origin"
  | "forbidden-host"
  | "no-pages"
  | "blocked"
  | "unreachable"
  | "timeout"
  | "internal"

const STATUS: Record<CaptureErrorCode, number> = {
  "invalid-url": 400,
  "invalid-device": 400,
  "forbidden-origin": 403,
  "forbidden-host": 403,
  "no-pages": 404,
  blocked: 502,
  unreachable: 502,
  timeout: 504,
  internal: 500,
}

export class CaptureError extends Error {
  constructor(
    readonly code: CaptureErrorCode,
    options?: { cause?: unknown }
  ) {
    super(code, options)
    this.name = "CaptureError"
  }

  get status() {
    return STATUS[this.code]
  }
}

/** Remonte la chaîne des `cause` pour retrouver une CaptureError enfouie (undici l'enveloppe). */
export function findCaptureError(error: unknown): CaptureError | undefined {
  let current = error
  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof CaptureError) return current
    current = (current as { cause?: unknown }).cause
  }
  return undefined
}

export function toCaptureError(error: unknown): CaptureError {
  const found = findCaptureError(error)
  if (found) return found
  if (isTimeout(error)) return new CaptureError("timeout", { cause: error })
  return new CaptureError("internal", { cause: error })
}

function isTimeout(error: unknown) {
  let current = error
  for (let depth = 0; current && depth < 5; depth++) {
    const name = (current as { name?: string }).name
    if (name === "TimeoutError" || name === "AbortError") return true
    current = (current as { cause?: unknown }).cause
  }
  return false
}

export function errorResponse(error: unknown, headers: Headers): Response {
  const captureError = toCaptureError(error)
  if (captureError.code === "internal") console.error(error)
  headers.set("Cache-Control", "no-store")
  return Response.json(
    { code: captureError.code },
    { status: captureError.status, headers }
  )
}
