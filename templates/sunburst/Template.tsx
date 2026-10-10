import { contrast, hexAlpha, readableOn, tone } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const COLUMN = { left: 130, top: 330, width: 780 }
/** Centre des rayons et du soleil : derrière les mockups. */
const ORIGIN = { x: 1580, y: 820 }
const SUN = 980
const RAY = 6
/** Débord du calque de rayons, pour remplir les formats plus larges ou plus hauts. */
const BLEED = 1200
const BROWSER_CONTENT = { min: 560, max: 700, empty: 640 }

/**
 * Affiche rétro : rayons de soleil (dégradé conique répété) qui partent de
 * derrière les mockups, disque de marque, texte à gauche sur fond crème.
 */
export function SunburstTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const paper = tone(brand, 0.965, 0.25)
  const ray = tone(brand, 0.9, 0.65)
  const ink = tone(brand, 0.22, 0.5)
  const accent = style.accentColor ?? readableOn(brand, paper)
  const onBrand = contrast(brand, "#ffffff") >= contrast(brand, ink) ? "#ffffff" : ink

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const both = showDesktop && showMobile
  const browserWidth = both ? 1080 : 1240
  const contentHeight = browserContentHeight(mockups.desktopImage, browserWidth, BROWSER_CONTENT)
  const browserHeight = contentHeight + 60
  const phoneScale = showDesktop ? 0.82 : 1.12

  return (
    <CoverRoot size={COVER_SIZE} style={{ background: paper }}>
      {/* Rayons, estompés vers les bords pour laisser respirer le texte. */}
      <div
        style={{
          position: "absolute",
          inset: -BLEED,
          backgroundImage: [
            `radial-gradient(circle at ${ORIGIN.x + BLEED}px ${ORIGIN.y + BLEED}px, transparent 0px, transparent 520px, ${paper} 1500px)`,
            `repeating-conic-gradient(from 0deg at ${ORIGIN.x + BLEED}px ${ORIGIN.y + BLEED}px, ${ray} 0deg ${RAY}deg, ${paper} ${RAY}deg ${RAY * 2}deg)`,
          ].join(", "),
        }}
      />

      {/* Soleil : anneau, puis disque de marque. */}
      <div
        style={{
          position: "absolute",
          left: ORIGIN.x - SUN / 2 - 90,
          top: ORIGIN.y - SUN / 2 - 90,
          width: SUN + 180,
          height: SUN + 180,
          borderRadius: "50%",
          border: `8px solid ${hexAlpha(brand, 0.35)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: ORIGIN.x - SUN / 2,
          top: ORIGIN.y - SUN / 2,
          width: SUN,
          height: SUN,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${tone(brand, 0.72, 1)} 0%, ${brand} 55%, ${tone(brand, 0.4, 1)} 100%)`,
          boxShadow: `0 40px 120px ${hexAlpha(tone(brand, 0.3, 1), 0.35)}`,
        }}
      />

      <TextBlock
        content={content}
        width={COLUMN.width}
        nameSize={112}
        descriptionLines={4}
        chipRadius={999}
        colors={{
          text: ink,
          muted: tone(brand, 0.38, 0.35),
          accent,
          badgeBorder: brand,
          badgeBg: brand,
          badgeText: onBrand,
          chipBg: "#ffffff",
          chipText: ink,
          chipBorder: tone(brand, 0.84, 0.6),
        }}
        style={{ position: "absolute", left: COLUMN.left, top: COLUMN.top }}
      />

      <Footer
        text={content.footer}
        color={tone(brand, 0.38, 0.35)}
        style={{ left: COLUMN.left, bottom: 100, width: COLUMN.width }}
      />

      {showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          favicon={content.icon}
          theme={resolveBrowserTheme(mockups)}
          width={browserWidth}
          contentHeight={contentHeight}
          cropY={mockups.desktopCropY}
          style={{
            position: "absolute",
            left: ORIGIN.x - browserWidth / 2 - (both ? 90 : 0),
            top: ORIGIN.y - browserHeight / 2,
          }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={phoneScale}
          style={{
            position: "absolute",
            left: both
              ? ORIGIN.x + browserWidth / 2 - 200
              : ORIGIN.x - (PHONE_SIZE.width * phoneScale) / 2,
            top: both
              ? ORIGIN.y - 140
              : ORIGIN.y - (PHONE_SIZE.height * phoneScale) / 2,
          }}
        />
      )}
    </CoverRoot>
  )
}
