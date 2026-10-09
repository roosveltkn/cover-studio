import type { CoverConfig } from "@/types/cover"

export const DEFAULT_BRAND = "#7d2ae8"

/** Contenu neutre de départ : l'utilisateur part de ses propres captures. */
export const DEFAULT_CONFIG: CoverConfig = {
  content: {
    badge: "Catégorie · Secteur",
    nameMain: "Mon",
    nameAccent: "App",
    description:
      "Décrivez en une phrase ce que fait votre application et à qui elle s'adresse.",
    chips: ["Fonctionnalité clé", "Responsive", "Open source"],
    footer: "monapp.com",
    browserUrl: "monapp.com",
  },
  style: { brandColor: DEFAULT_BRAND },
  mockups: { showDesktop: true, showMobile: true, browserTheme: "auto" },
  export: { format: "png", scale: 1 },
}

/** Couleurs proposées dans le sélecteur, dont les cas limites de contraste. */
export const COLOR_PRESETS = [
  "#7d2ae8",
  "#4f46e5",
  "#2563eb",
  "#06b6d4",
  "#16a34a",
  "#facc15",
  "#f97316",
  "#ef4444",
  "#db2777",
  "#000000",
]
