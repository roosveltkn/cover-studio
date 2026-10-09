import { hexAlpha, readableOn, tone } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, gridLayers, resolveBrowserTheme } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const TEXT = { top: 100, width: 1700 }
const BROWSER = { width: 1800, contentHeight: 1100 }
const GRID_CELL = 64

/**
 * Lancement façon Product Hunt : fond clair teinté, texte centré en haut,
 * grand navigateur centré qui sort par le bas du cadre.
 */
export function SpotlightTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bgTop = tone(brand, 0.975, 0.25)
  const bgBottom = tone(brand, 0.9, 0.55)
  const ink = tone(brand, 0.22, 0.5)
  const accent = style.accentColor ?? readableOn(brand, bgTop)

  // Le bloc de mockups démarre sous le texte, plus bas quand il y a des chips.
  const mockupTop = content.chips.length > 0 ? 690 : 600
  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const browserLeft = (COVER_SIZE.width - BROWSER.width) / 2

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bgTop,
        backgroundImage: [
          ...gridLayers(hexAlpha(ink, 0.05)),
          `radial-gradient(ellipse 55% 45% at 50% 100%, ${hexAlpha(brand, 0.45)} 0%, transparent 100%)`,
          `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
        ].join(", "),
        backgroundSize: `${GRID_CELL}px ${GRID_CELL}px, ${GRID_CELL}px ${GRID_CELL}px, 100% 100%, 100% 100%`,
      }}
    >
      <Footer
        text={content.footer}
        color={tone(brand, 0.35, 0.4)}
        style={{ left: 90, top: 64, maxWidth: 600, fontSize: 24 }}
      />

      <TextBlock
        content={content}
        align="center"
        width={TEXT.width}
        nameSize={96}
        descriptionLines={2}
        chipRadius={999}
        colors={{
          text: ink,
          muted: tone(brand, 0.42, 0.35),
          accent,
          badgeBorder: tone(brand, 0.8, 0.6),
          badgeBg: "rgba(255, 255, 255, 0.7)",
          badgeText: readableOn(brand, "#ffffff"),
          chipBg: "#ffffff",
          chipText: ink,
          chipBorder: tone(brand, 0.88, 0.4),
        }}
        style={{ position: "absolute", left: (COVER_SIZE.width - TEXT.width) / 2, top: TEXT.top }}
      />

      {showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          theme={resolveBrowserTheme(mockups)}
          width={BROWSER.width}
          contentHeight={BROWSER.contentHeight}
          cropY={mockups.desktopCropY}
          style={{
            position: "absolute",
            left: browserLeft,
            top: mockupTop,
            boxShadow: `0 -10px 80px ${hexAlpha(tone(brand, 0.3, 0.8), 0.25)}, 0 40px 100px rgba(0, 0, 0, 0.25)`,
          }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={showDesktop ? 0.85 : 1.05}
          style={{
            position: "absolute",
            left: showDesktop
              ? browserLeft + BROWSER.width - PHONE_SIZE.width * 0.85 + 60
              : (COVER_SIZE.width - PHONE_SIZE.width * 1.05) / 2,
            top: showDesktop ? mockupTop + 160 : mockupTop,
          }}
        />
      )}
    </CoverRoot>
  )
}
