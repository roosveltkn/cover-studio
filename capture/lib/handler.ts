import { corsHeaders } from "./cors.js"
import { CaptureError, errorResponse } from "./errors.js"

type Run = (url: URL, headers: Headers) => Promise<Response>

/**
 * Enveloppe commune des endpoints (format « fetch » des Vercel Functions) :
 * CORS, préflight, méthode GET seule, erreurs codées en JSON.
 */
export function createHandler(run: Run) {
  return {
    async fetch(request: Request): Promise<Response> {
      let headers = new Headers()
      try {
        headers = corsHeaders(request)
        if (request.method === "OPTIONS")
          return new Response(null, { status: 204, headers })
        if (request.method !== "GET") {
          headers.set("Allow", "GET, OPTIONS")
          return new Response(null, { status: 405, headers })
        }
        return await run(new URL(request.url), headers)
      } catch (error) {
        return errorResponse(error, headers)
      }
    },
  }
}

/** Borne la durée d'un traitement, sous le maxDuration de la fonction. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CaptureError("timeout")), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
