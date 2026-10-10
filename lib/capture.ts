import type { MessageKey, Translator } from "@/i18n/translator"
import type {
  CaptureDevice,
  CaptureErrorCode,
  CaptureResult,
  DiscoverResponse,
  ServiceErrorCode,
} from "@/types/capture"

/**
 * URL du service de capture (projet capture/, voir docs/CAPTURE.md). Sans elle,
 * la capture depuis une URL est masquée et l'app reste 100 % locale (forks).
 */
export const CAPTURE_ENDPOINT =
  process.env.NEXT_PUBLIC_CAPTURE_ENDPOINT?.trim().replace(/\/+$/, "") ||
  undefined

const MAX_URL_LENGTH = 2048
/** Captures lancées en même temps : au-delà, le rate limiting du service répond 429. */
const DEFAULT_CONCURRENCY = 2
/** Captures gardées en mémoire (≈ 100 à 300 Ko chacune). */
const MAX_CACHED = 40

const SERVICE_CODES: ServiceErrorCode[] = [
  "invalid-url",
  "invalid-device",
  "forbidden-origin",
  "forbidden-host",
  "no-pages",
  "blocked",
  "unreachable",
  "timeout",
  "internal",
]

export class CaptureError extends Error {
  constructor(readonly code: CaptureErrorCode) {
    super(code)
  }
}

/** Les erreurs de configuration (origine, appareil) n'ont pas de message propre. */
const MESSAGE_KEYS: Record<CaptureErrorCode, MessageKey<"errors">> = {
  "invalid-url": "captureInvalidUrl",
  "invalid-device": "captureFailed",
  "forbidden-origin": "captureFailed",
  "forbidden-host": "captureForbiddenHost",
  "no-pages": "captureNoPages",
  blocked: "captureBlocked",
  unreachable: "captureUnreachable",
  timeout: "captureTimeout",
  internal: "captureFailed",
  "rate-limited": "captureRateLimited",
  network: "captureNetwork",
}

/** Message d'erreur de capture dans la langue de l'interface. */
export function describeCaptureError(error: unknown, t: Translator<"errors">) {
  return t(
    error instanceof CaptureError ? MESSAGE_KEYS[error.code] : "captureFailed"
  )
}

/** Annulation volontaire (AbortController) : à ignorer, pas à afficher. */
export function isAbortError(error: unknown) {
  return (error as { name?: string } | null)?.name === "AbortError"
}

/**
 * Normalise l'adresse saisie : ajoute `https://` si le schéma manque, pour
 * qu'on puisse taper `monsite.com`. Contrôle de confort seulement : le service
 * refait toutes les vérifications.
 */
export function normalizeSiteUrl(input: string): string {
  const raw = input.trim()
  if (!raw || raw.length > MAX_URL_LENGTH) throw new CaptureError("invalid-url")
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new CaptureError("invalid-url")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new CaptureError("invalid-url")
  // « monsite » sans extension : faute de frappe plutôt qu'un vrai site.
  if (!url.hostname.includes(".") && !url.hostname.startsWith("["))
    throw new CaptureError("invalid-url")
  url.hash = ""
  return url.href
}

/** Nom de fichier lisible : `stripe.com-fr-pricing-desktop.webp`. */
export function captureFileName(url: string, device: CaptureDevice) {
  const { hostname, pathname } = new URL(url)
  const slug = `${hostname.replace(/^www\./, "")}${pathname}`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
  return `${slug || "capture"}-${device}.webp`
}

/** Fichier prêt pour `readImage` (lib/image.ts), comme un import manuel. */
export function captureToFile(result: CaptureResult): File {
  return new File([result.blob], captureFileName(result.url, result.device), {
    type: result.blob.type || "image/webp",
  })
}

/**
 * File d'attente : `concurrency` tâches au plus en parallèle. Une tâche annulée
 * avant son tour quitte la file sans rien lancer.
 */
function createLimiter(concurrency: number) {
  let active = 0
  const waiting: Array<() => void> = []

  return async function run<T>(
    task: () => Promise<T>,
    signal: AbortSignal
  ): Promise<T> {
    signal.throwIfAborted()
    if (active < concurrency) {
      active++
    } else {
      // La place est transmise par la tâche qui se termine : `active` ne bouge pas.
      await new Promise<void>((resolve, reject) => {
        const start = () => {
          signal.removeEventListener("abort", cancel)
          resolve()
        }
        const cancel = () => {
          const index = waiting.indexOf(start)
          if (index >= 0) waiting.splice(index, 1)
          reject(signal.reason)
        }
        waiting.push(start)
        signal.addEventListener("abort", cancel, { once: true })
      })
    }
    try {
      return await task()
    } finally {
      const next = waiting.shift()
      if (next) next()
      else active--
    }
  }
}

/**
 * Rattache un appelant à une requête partagée : il peut abandonner sans
 * annuler la requête pour les autres. `release` est appelé à son abandon.
 */
function follow<T>(
  shared: Promise<T>,
  signal: AbortSignal | undefined,
  release: () => void
) {
  if (!signal) return shared
  return new Promise<T>((resolve, reject) => {
    const abandon = () => {
      release()
      reject(signal.reason)
    }
    signal.addEventListener("abort", abandon, { once: true })
    shared.then(
      (value) => {
        signal.removeEventListener("abort", abandon)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener("abort", abandon)
        reject(error)
      }
    )
  })
}

type Pending = {
  promise: Promise<CaptureResult>
  controller: AbortController
  /** Appelants encore intéressés ; à zéro, la requête est annulée. */
  followers: number
}

export type CaptureClient = ReturnType<typeof createCaptureClient>

export function createCaptureClient(options: {
  endpoint: string
  fetch?: typeof fetch
  concurrency?: number
}) {
  const endpoint = options.endpoint.replace(/\/+$/, "")
  const fetchImpl = options.fetch ?? ((input, init) => fetch(input, init))
  const limit = createLimiter(options.concurrency ?? DEFAULT_CONCURRENCY)
  const done = new Map<string, CaptureResult>()
  const pending = new Map<string, Pending>()

  /** Appelle le service et traduit tout échec en CaptureError (sauf annulation). */
  async function call(
    path: string,
    params: Record<string, string>,
    signal?: AbortSignal
  ) {
    let response: Response
    try {
      response = await fetchImpl(
        `${endpoint}${path}?${new URLSearchParams(params)}`,
        {
          signal,
        }
      )
    } catch (error) {
      if (isAbortError(error)) throw error
      throw new CaptureError("network")
    }
    if (response.ok) return response
    if (response.status === 429) throw new CaptureError("rate-limited")
    const body = (await response.json().catch(() => null)) as {
      code?: unknown
    } | null
    const code = SERVICE_CODES.find((known) => known === body?.code)
    throw new CaptureError(code ?? "internal")
  }

  const keyOf = (url: string, device: CaptureDevice) => `${device} ${url}`

  function remember(key: string, result: CaptureResult) {
    done.delete(key)
    done.set(key, result)
    // Map garde l'ordre d'insertion : la première clé est la plus ancienne.
    if (done.size > MAX_CACHED) done.delete(done.keys().next().value!)
  }

  return {
    /** Pages du site, voir `GET /api/discover`. */
    async discoverPages(
      url: string,
      signal?: AbortSignal
    ): Promise<DiscoverResponse> {
      const response = await call("/api/discover", { url }, signal)
      const data = (await response
        .json()
        .catch(() => null)) as DiscoverResponse | null
      if (!data || !Array.isArray(data.pages))
        throw new CaptureError("internal")
      return data
    },

    /** Capture déjà reçue, sans requête : sert à l'aperçu au clic. */
    cached(url: string, device: CaptureDevice): CaptureResult | undefined {
      return done.get(keyOf(url, device))
    },

    /**
     * Capture d'une page. Le résultat est gardé en mémoire : l'aperçu au clic
     * puis la capture finale de la même page ne coûtent qu'un rendu Chrome.
     * Deux demandes simultanées de la même page partagent la requête.
     */
    capturePage(
      url: string,
      device: CaptureDevice,
      signal?: AbortSignal
    ): Promise<CaptureResult> {
      signal?.throwIfAborted()
      const key = keyOf(url, device)
      const cached = done.get(key)
      if (cached) return Promise.resolve(cached)

      let entry = pending.get(key)
      if (!entry) {
        const controller = new AbortController()
        const promise: Promise<CaptureResult> = limit(async () => {
          const response = await call(
            "/api/capture",
            { url, device },
            controller.signal
          )
          const blob = await response.blob()
          if (!blob.type.startsWith("image/"))
            throw new CaptureError("internal")
          return {
            blob,
            url: response.headers.get("X-Capture-Url") ?? url,
            device,
          }
        }, controller.signal)
          .then((result) => {
            remember(key, result)
            return result
          })
          .finally(() => {
            // Ne retire que sa propre entrée : une requête annulée a pu être remplacée.
            if (pending.get(key)?.promise === promise) pending.delete(key)
          })
        entry = { promise, controller, followers: 0 }
        pending.set(key, entry)
      }

      const shared = entry
      shared.followers++
      return follow(shared.promise, signal, () => {
        shared.followers--
        if (shared.followers > 0) return
        // Plus personne n'attend : on libère la place et on annule la requête.
        if (pending.get(key) === shared) pending.delete(key)
        shared.controller.abort(signal?.reason)
      })
    },
  }
}

/** Client de l'app ; null quand le service n'est pas configuré. */
export const captureClient = CAPTURE_ENDPOINT
  ? createCaptureClient({ endpoint: CAPTURE_ENDPOINT })
  : null
