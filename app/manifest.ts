import type { MetadataRoute } from "next"

// Généré au build : obligatoire avec `output: "export"`.
export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cover Studio",
    short_name: "Cover Studio",
    description:
      "Générez une cover de présentation pour votre application à partir de vos captures.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#050712",
    theme_color: "#050712",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/cover-studio-symbol.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
