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
    background_color: "#F2ECFF",
    theme_color: "#7D2AE8",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
