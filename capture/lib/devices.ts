import type { Viewport } from "puppeteer-core"

export type Device = "desktop" | "mobile"

type DeviceProfile = {
  viewport: Viewport
  /** null : celui de Chrome, nettoyé de « HeadlessChrome ». */
  userAgent: string | null
}

/**
 * Profils de capture. Le desktop donne une image paysage (cadre navigateur),
 * le mobile une image portrait (cadre téléphone) : lib/slots.ts les place
 * selon l'orientation.
 */
export const DEVICES: Record<Device, DeviceProfile> = {
  desktop: {
    viewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    userAgent: null,
  },
  mobile: {
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  },
}

export function parseDevice(value: string | null): Device | null {
  return value === "desktop" || value === "mobile" ? value : null
}
