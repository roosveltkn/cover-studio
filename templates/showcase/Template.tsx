import { hexAlpha } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  gridLayers,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

import { derivePalette } from "./palette"

const COLUMN = { left: 135, top: 285, width: 720 }
const BROWSER = { left: 900, top: 180, width: 1290 }
const BROWSER_CONTENT = { min: 700, max: 960, empty: 860 }
const PHONE = { left: 1907, top: 510 }
const GRID_CELL = 58

export function ShowcaseTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const palette = derivePalette(style.brandColor, style.accentColor)
  const haloIntensity = style.haloIntensity ?? 0.35
  const gridOpacity = style.gridOpacity ?? 0.045

  const phoneOnly = mockups.showMobile && !mockups.showDesktop
  const phonePosition = phoneOnly
    ? {
        left: (BROWSER.left + PHONE.left + PHONE_SIZE.width) / 2 - PHONE_SIZE.width / 2,
        top: (COVER_SIZE.height - PHONE_SIZE.height) / 2,
      }
    : PHONE

  const background = [
    ...gridLayers(`rgba(255, 255, 255, ${gridOpacity})`),
    `radial-gradient(ellipse 40% 45% at 100% 0%, ${hexAlpha(palette.halo, haloIntensity)} 0%, transparent 100%)`,
    palette.shade,
  ].join(", ")

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: palette.base,
        backgroundImage: background,
        backgroundSize: `${GRID_CELL}px ${GRID_CELL}px, ${GRID_CELL}px ${GRID_CELL}px, 100% 100%, 100% 100%`,
      }}
    >
      <TextBlock
        content={content}
        width={COLUMN.width}
        colors={{
          text: "#ffffff",
          muted: "rgba(255, 255, 255, 0.92)",
          accent: palette.nameAccent,
          badgeBorder: palette.badgeBorder,
          badgeBg: palette.badgeBg,
          chipBg: palette.chipBg,
        }}
        style={{ position: "absolute", left: COLUMN.left, top: COLUMN.top }}
      />

      <Footer
        text={content.footer}
        color="#ffffff"
        style={{ left: COLUMN.left, bottom: 105, width: COLUMN.width }}
      />

      {mockups.showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          favicon={content.icon}
          theme={resolveBrowserTheme(mockups)}
          width={BROWSER.width}
          contentHeight={browserContentHeight(mockups.desktopImage, BROWSER.width, BROWSER_CONTENT)}
          cropY={mockups.desktopCropY}
          style={{ position: "absolute", left: BROWSER.left, top: BROWSER.top }}
        />
      )}

      {mockups.showMobile && (
        <PhoneFrame image={mockups.mobileImage} style={{ position: "absolute", ...phonePosition }} />
      )}
    </CoverRoot>
  )
}
