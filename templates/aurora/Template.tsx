import { hexAlpha, hexToOklch, oklch, oklchToHex, tone } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const CARD = { left: 110, bottom: 110, width: 1010, padding: 68 }
const BROWSER = { left: 1180, top: 130, width: 1420 }
const BROWSER_CONTENT = { min: 680, max: 840, empty: 800 }
const PHONE = { left: 1930, top: 560, scale: 0.92 }
/** Inclinaison commune : les mockups montent vers le coin haut-droite. */
const TILT = "rotate(-6deg)"

/** Même luminosité relative, teinte décalée : les taches du dégradé maillé. */
function shifted(
  color: string,
  l: number,
  chromaScale: number,
  hueShift: number
) {
  const { c, h } = hexToOklch(color)
  return oklchToHex(oklch(l, (c ?? 0) * chromaScale, (h ?? 0) + hueShift))
}

/**
 * Dégradé maillé multicolore dérivé de la marque (teintes voisines), carte de
 * verre dépoli en bas à gauche et mockups inclinés en diagonale.
 */
export function AuroraTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const base = tone(brand, 0.17, 0.55)
  const accent = style.accentColor ?? shifted(brand, 0.86, 0.75, 40)

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const contentHeight = browserContentHeight(
    mockups.desktopImage,
    BROWSER.width,
    BROWSER_CONTENT
  )

  // Taches floues en dégradés radiaux (pas de `filter: blur`, mal rendu à l'export).
  const mesh = [
    `radial-gradient(ellipse 55% 60% at 88% 8%, ${hexAlpha(shifted(brand, 0.64, 1.15, 0), 0.9)} 0%, transparent 70%)`,
    `radial-gradient(ellipse 45% 55% at 30% 0%, ${hexAlpha(shifted(brand, 0.52, 1, 50), 0.75)} 0%, transparent 70%)`,
    `radial-gradient(ellipse 60% 55% at 72% 100%, ${hexAlpha(shifted(brand, 0.55, 1, -55), 0.75)} 0%, transparent 70%)`,
    `radial-gradient(ellipse 45% 50% at 0% 80%, ${hexAlpha(shifted(brand, 0.42, 0.9, 150), 0.6)} 0%, transparent 70%)`,
  ]

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{ backgroundColor: base, backgroundImage: mesh.join(", ") }}
    >
      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.78)"
        style={{
          left: CARD.left + 8,
          top: 96,
          maxWidth: CARD.width,
          fontSize: 26,
        }}
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
            top: showMobile ? BROWSER.top : BROWSER.top + 90,
            transform: TILT,
            boxShadow: `0 60px 140px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.16)`,
          }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={showDesktop ? PHONE.scale : 1.15}
          style={{
            position: "absolute",
            ...(showDesktop
              ? { left: PHONE.left, top: PHONE.top }
              : { left: 1520, top: 200 }),
            transform: TILT,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: CARD.left,
          bottom: CARD.bottom,
          width: CARD.width,
          padding: CARD.padding,
          borderRadius: 52,
          background:
            "linear-gradient(140deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.05) 100%)",
          border: "2px solid rgba(255, 255, 255, 0.22)",
          boxShadow:
            "inset 0 2px 0 rgba(255, 255, 255, 0.25), 0 40px 100px rgba(0, 0, 0, 0.28)",
        }}
      >
        <TextBlock
          content={content}
          width={CARD.width - CARD.padding * 2}
          nameSize={104}
          chipRadius={999}
          colors={{
            text: "#ffffff",
            muted: "rgba(255, 255, 255, 0.84)",
            accent,
            badgeBorder: "rgba(255, 255, 255, 0.32)",
            badgeBg: "rgba(255, 255, 255, 0.1)",
            chipBg: "rgba(255, 255, 255, 0.1)",
            chipBorder: "rgba(255, 255, 255, 0.2)",
          }}
        />
      </div>
    </CoverRoot>
  )
}
