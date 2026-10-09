import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// Généré au build : obligatoire avec `output: "export"`.
export const dynamic = "force-static"

// L'éditeur reste explorable : son `noindex` n'est lu que si le robot peut le charger.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
