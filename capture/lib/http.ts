import { lookup as dnsLookup, type LookupAddress } from "node:dns"
import type { LookupFunction } from "node:net"
import { Agent, fetch, type Response } from "undici"

import { CaptureError, findCaptureError } from "./errors.js"
import { acceptLanguage, DEFAULT_LANGUAGE } from "./language.js"
import { isPublicAddress, parseTargetUrl } from "./url-guard.js"

const TIMEOUT_MS = 8_000
const MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 5

/** User-Agent de navigateur, suffixé pour rester identifiable par les sites. */
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 CoverStudio/1.0 (+https://github.com/roosveltkn/cover-studio)"

/**
 * Résolution DNS filtrée, appelée par undici au moment d'ouvrir la connexion :
 * l'adresse vérifiée est celle utilisée, ce qui neutralise le DNS rebinding.
 * Les hôtes IP littéraux ne passent pas par ici ; parseTargetUrl les filtre.
 */
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0)
    const list = addresses as LookupAddress[]
    if (list.length === 0)
      return callback(
        new CaptureError("unreachable") as NodeJS.ErrnoException,
        "",
        0
      )
    if (!list.every((entry) => isPublicAddress(entry.address)))
      return callback(
        new CaptureError("forbidden-host") as NodeJS.ErrnoException,
        "",
        0
      )
    if (options.all) return callback(null, list)
    callback(null, list[0].address, list[0].family)
  })
}

const agent = new Agent({
  connect: { lookup: guardedLookup, timeout: TIMEOUT_MS },
  headersTimeout: TIMEOUT_MS,
  bodyTimeout: TIMEOUT_MS,
})

export type FetchResult = {
  /** Adresse finale, après redirections. */
  url: URL
  status: number
  contentType: string
  body: string
}

export type FetchText = (
  url: URL,
  options?: { accept?: string; language?: string }
) => Promise<FetchResult>

/**
 * GET texte borné : redirections suivies à la main et revalidées, taille et
 * durée plafonnées. Les statuts d'erreur HTTP sont renvoyés, pas levés :
 * un 404 sur robots.txt est normal.
 */
export const fetchText: FetchText = async (url, options = {}) => {
  let current = url
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await fetch(current, {
        dispatcher: agent,
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": USER_AGENT,
          Accept: options.accept ?? "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": acceptLanguage(
            options.language ?? DEFAULT_LANGUAGE
          ),
        },
      })

      const location = response.headers.get("location")
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel()
        current = parseTargetUrl(new URL(location, current).href)
        continue
      }

      const contentType = response.headers.get("content-type") ?? ""
      const bytes = await readCapped(response.body)
      return {
        url: current,
        status: response.status,
        contentType,
        body: decode(bytes, contentType),
      }
    }
  } catch (error) {
    const known = findCaptureError(error)
    if (known) throw known
    if (isTimeout(error)) throw new CaptureError("timeout", { cause: error })
    throw new CaptureError("unreachable", { cause: error })
  }
  throw new CaptureError("unreachable")
}

async function readCapped(body: Response["body"]) {
  if (!body) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > MAX_BYTES) {
      await body.cancel().catch(() => {})
      throw new CaptureError("unreachable")
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function decode(bytes: Uint8Array, contentType: string) {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1]
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes)
  } catch {
    return new TextDecoder("utf-8").decode(bytes)
  }
}

function isTimeout(error: unknown) {
  const name = (error as { name?: string } | undefined)?.name
  const code = (error as { cause?: { code?: string } } | undefined)?.cause?.code
  return (
    name === "TimeoutError" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_HEADERS_TIMEOUT" ||
    code === "UND_ERR_BODY_TIMEOUT"
  )
}
