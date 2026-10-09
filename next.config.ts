import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Site 100 % statique : aucun backend, hébergeable sur n'importe quel CDN.
  output: "export",
  images: { unoptimized: true },
}

export default nextConfig
