import { lookup } from "node:dns/promises"
import ipaddr from "ipaddr.js"

import { CaptureError } from "./errors.js"

const MAX_URL_LENGTH = 2048
const ALLOWED_PORTS = new Set(["", "80", "443"])
/** Noms qui désignent toujours le réseau local, refusés sans résolution DNS. */
const LOCAL_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"]
/** Plage de l'unicast global IPv6 : tout le reste (ULA, NAT64, 6to4…) est refusé. */
const IPV6_GLOBAL = ipaddr.parseCIDR("2000::/3")

export type Resolver = (hostname: string) => Promise<string[]>

const systemResolver: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })).map(
    (entry) => entry.address
  )

/**
 * Lit une adresse saisie et la normalise. N'accepte que http(s) sur les ports
 * standards, sans identifiants. Ajoute `https://` si le schéma manque, pour
 * qu'on puisse taper `monsite.com`.
 */
export function parseTargetUrl(input: string | null | undefined): URL {
  const raw = input?.trim()
  if (!raw || raw.length > MAX_URL_LENGTH) throw new CaptureError("invalid-url")
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch (error) {
    throw new CaptureError("invalid-url", { cause: error })
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new CaptureError("invalid-url")
  if (url.username || url.password || !ALLOWED_PORTS.has(url.port))
    throw new CaptureError("invalid-url")
  if (!url.hostname) throw new CaptureError("invalid-url")

  url.hash = ""
  assertPublicName(url.hostname)
  return url
}

/** Hôte entre crochets pour l'IPv6 dans une URL : on les retire. */
function bareHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "")
}

function assertPublicName(hostname: string) {
  const host = bareHostname(hostname).toLowerCase().replace(/\.$/, "")
  if (host === "localhost" || LOCAL_SUFFIXES.some((s) => host.endsWith(s)))
    throw new CaptureError("forbidden-host")
  // Un nom sans point (« intranet ») ne se résout que sur un réseau local.
  if (!ipaddr.isValid(host) && !host.includes("."))
    throw new CaptureError("forbidden-host")
  if (ipaddr.isValid(host) && !isPublicAddress(host))
    throw new CaptureError("forbidden-host")
}

/**
 * Vrai seulement pour une adresse unicast publique. Liste blanche : toute
 * plage spéciale (privée, loopback, link-local, CGNAT, IPv4 mappée, NAT64…)
 * est refusée, y compris celles qu'ipaddr.js ajoutera plus tard.
 */
export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false
  // `process` convertit une IPv4 mappée (::ffff:127.0.0.1) en IPv4.
  const parsed = ipaddr.process(address)
  if (parsed.range() !== "unicast") return false
  if (parsed.kind() === "ipv6")
    return (parsed as ipaddr.IPv6).match(IPV6_GLOBAL as [ipaddr.IPv6, number])
  return true
}

/** Hôte littéral (IP) : pas de résolution, le contrôle se fait sur l'adresse. */
export function isIpLiteral(hostname: string) {
  return ipaddr.isValid(bareHostname(hostname))
}

/**
 * Vérifie que toutes les adresses de l'hôte sont publiques. Le contrôle qui
 * fait foi pour `fetch` a lieu à la connexion (voir http.ts) ; celui-ci sert
 * à refuser tôt et à filtrer les requêtes de Chrome.
 */
export async function assertPublicHost(
  url: URL,
  resolve: Resolver = systemResolver
): Promise<void> {
  assertPublicName(url.hostname)
  if (isIpLiteral(url.hostname)) return

  let addresses: string[]
  try {
    addresses = await resolve(url.hostname)
  } catch (error) {
    throw new CaptureError("unreachable", { cause: error })
  }
  if (addresses.length === 0) throw new CaptureError("unreachable")
  if (!addresses.every(isPublicAddress))
    throw new CaptureError("forbidden-host")
}

/**
 * Mémorise le verdict par hôte le temps d'une capture : une page charge des
 * dizaines de ressources depuis les mêmes domaines.
 */
export function createHostChecker(resolve: Resolver = systemResolver) {
  const verdicts = new Map<string, Promise<boolean>>()
  return (url: URL) => {
    const key = url.hostname
    let verdict = verdicts.get(key)
    if (!verdict) {
      verdict = assertPublicHost(url, resolve).then(
        () => true,
        () => false
      )
      verdicts.set(key, verdict)
    }
    return verdict
  }
}
