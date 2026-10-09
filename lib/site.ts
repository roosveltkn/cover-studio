/**
 * URL publique du site, utilisée pour les URL absolues (Open Graph, sitemap, JSON-LD).
 * À définir en production : `NEXT_PUBLIC_SITE_URL=https://votre-domaine.tld`.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
)

export const GITHUB_URL = "https://github.com/RoosveltK/cover-studio"

export const LINKS = {
  github: GITHUB_URL,
  issues: `${GITHUB_URL}/issues`,
  license: `${GITHUB_URL}/blob/main/LICENSE`,
} as const
