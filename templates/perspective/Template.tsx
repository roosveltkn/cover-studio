import { hexAlpha, readableOn, tone } from "@/lib/color"
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

const COLUMN = { left: 135, top: 300, width: 740 }
const BROWSER = { left: 960, top: 230, width: 1240 }
const BROWSER_CONTENT = { min: 680, max: 860, empty: 780 }
const PHONE_SCALE = 0.92
const GRID_CELL = 80
/** Inclinaison commune aux mockups : la scène tourne vers le texte. */
const TILT = "perspective(3200px) rotateY(-17deg) rotateX(7deg)"

/** Scène sombre et cinématique : mockups inclinés en 3D devant un halo de marque. */
export function PerspectiveTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bg = tone(brand, 0.14, 0.3)
  const glow = tone(brand, 0.6, 1.1)
  const accent = style.accentColor ?? readableOn(tone(brand, 0.78, 1), bg)

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const contentHeight = browserContentHeight(mockups.desktopImage, BROWSER.width, BROWSER_CONTENT)

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bg,
        backgroundImage: [
          ...gridLayers("rgba(255, 255, 255, 0.035)"),
          `radial-gradient(ellipse 42% 55% at 72% 52%, ${hexAlpha(glow, 0.55)} 0%, transparent 100%)`,
          `radial-gradient(ellipse 70% 60% at 0% 100%, ${hexAlpha(tone(brand, 0.3, 0.8), 0.6)} 0%, transparent 100%)`,
        ].join(", "),
        backgroundSize: `${GRID_CELL}px ${GRID_CELL}px, ${GRID_CELL}px ${GRID_CELL}px, 100% 100%, 100% 100%`,
      }}
    >
      <TextBlock
        content={content}
        width={COLUMN.width}
        chipRadius={999}
        colors={{
          text: "#ffffff",
          muted: "rgba(255, 255, 255, 0.72)",
          accent,
          badgeBorder: hexAlpha(accent, 0.6),
          badgeBg: hexAlpha(accent, 0.12),
          badgeText: accent,
          chipBg: "rgba(255, 255, 255, 0.06)",
          chipBorder: "rgba(255, 255, 255, 0.14)",
        }}
        style={{ position: "absolute", left: COLUMN.left, top: COLUMN.top }}
      />

      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.8)"
        style={{ left: COLUMN.left, bottom: 105, width: COLUMN.width }}
      />

      {showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          favicon={content.icon}
          theme={resolveBrowserTheme(mockups)}
          width={BROWSER.width}
          contentHeight={contentHeight}
          cropY={mockups.desktopCropY}
          style={{
            position: "absolute",
            left: BROWSER.left,
            top: BROWSER.top,
            transform: TILT,
            transformOrigin: "0% 50%",
            boxShadow: `0 60px 140px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 120px ${hexAlpha(glow, 0.35)}`,
          }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={showDesktop ? PHONE_SCALE : 1.1}
          style={{
            position: "absolute",
            left: showDesktop ? 1840 : 1450,
            top: showDesktop ? 470 : (COVER_SIZE.height - PHONE_SIZE.height * 1.1) / 2,
            transform: TILT,
            transformOrigin: "0% 50%",
          }}
        />
      )}
    </CoverRoot>
  )
}
