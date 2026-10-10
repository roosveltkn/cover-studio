/**
 * Contrat du service de capture d'URL (docs/CAPTURE.md). Copie volontaire des
 * types de capture/ : les deux projets Vercel ne partagent pas de code.
 */

export type CaptureDevice = "desktop" | "mobile"

export type PageGroup = "home" | "navigation" | "pages" | "blog" | "legal"
export type PageSource = "nav" | "link" | "sitemap" | "render"

export type DiscoveredPage = {
  url: string
  /** Chemin affichable : "/", "/pricing". */
  path: string
  /** Texte du lien de navigation, ou chemin humanisé ; null pour l'accueil sans libellé. */
  label: string | null
  group: PageGroup
  source: PageSource
}

export type DiscoverResponse = {
  /** Adresse de la page d'accueil après redirections. */
  site: string
  /** Pages retenues, dans l'ordre d'affichage conseillé (50 au plus). */
  pages: DiscoveredPage[]
  /** Nombre de pages trouvées avant plafonnement. */
  total: number
  /** Métadonnées de la page d'accueil, pour préremplir la cover. */
  meta: {
    title?: string
    description?: string
    themeColor?: string
    lang?: string
  }
}

/** Codes renvoyés par le service dans `{ code }`. */
export type ServiceErrorCode =
  | "invalid-url"
  | "invalid-device"
  | "forbidden-origin"
  | "forbidden-host"
  | "no-pages"
  | "blocked"
  | "unreachable"
  | "timeout"
  | "internal"

/**
 * Codes côté app : ceux du service, plus `rate-limited` (posé par le firewall
 * Vercel) et `network` (service injoignable, CORS refusé, hors ligne).
 */
export type CaptureErrorCode = ServiceErrorCode | "rate-limited" | "network"

export type CaptureResult = {
  blob: Blob
  /** Adresse réellement capturée, après redirections. */
  url: string
  device: CaptureDevice
}
