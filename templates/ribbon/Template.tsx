import { hexAlpha, readableOn, tone } from "@/lib/color"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, phoneScreens } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const TEXT = { left: 120, top: 100, width: 1050 }
const PHONE_SCALE = 1
const GAP = 70
const BAND_CENTER = { x: 1450, y: 930 }
/** Le ruban déborde largement du canevas, pour couvrir aussi les formats plus larges. */
const BAND_WIDTH = 5000
const TILT = -10

/**
 * Ruban diagonal qui traverse un fond de marque plein et porte les trois
 * captures (une par téléphone) ; texte en haut à gauche, au-dessus du ruban.
 */
export function RibbonTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bg = readableOn(brand, "#ffffff")
  const accent = style.accentColor ?? tone(brand, 0.9, 0.6)
  const screens = phoneScreens(mockups)

  const bandHeight = PHONE_SIZE.height * PHONE_SCALE + 160

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bg,
        backgroundImage: [
          `radial-gradient(ellipse 60% 50% at 20% 0%, ${hexAlpha(tone(brand, 0.75, 1), 0.45)} 0%, transparent 100%)`,
          `radial-gradient(ellipse 60% 60% at 100% 100%, rgba(0, 0, 0, 0.25) 0%, transparent 100%)`,
        ].join(", "),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: BAND_CENTER.x - BAND_WIDTH / 2,
          top: BAND_CENTER.y - bandHeight / 2,
          width: BAND_WIDTH,
          height: bandHeight,
          transform: `rotate(${TILT}deg)`,
          background: "rgba(255, 255, 255, 0.1)",
          borderTop: "2px solid rgba(255, 255, 255, 0.25)",
          borderBottom: "2px solid rgba(255, 255, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: GAP,
        }}
      >
        {/* Capture principale au centre, entre la 2e et la 3e. */}
        {[screens[1], screens[0], screens[2]].map((screen, index) => (
          <PhoneFrame
            key={index}
            image={screen.image}
            imagePosition={screen.position}
            scale={PHONE_SCALE}
            style={{ flexShrink: 0 }}
          />
        ))}
      </div>

      <TextBlock
        content={content}
        width={TEXT.width}
        nameSize={112}
        descriptionLines={2}
        chipRadius={999}
        colors={{
          text: "#ffffff",
          muted: "rgba(255, 255, 255, 0.88)",
          accent,
          badgeBorder: "rgba(255, 255, 255, 0.4)",
          badgeBg: "rgba(255, 255, 255, 0.12)",
          chipBg: "rgba(255, 255, 255, 0.14)",
          chipBorder: "rgba(255, 255, 255, 0.3)",
        }}
        style={{ position: "absolute", left: TEXT.left, top: TEXT.top }}
      />

      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.85)"
        style={{ right: 120, bottom: 90, maxWidth: 900, textAlign: "right" }}
      />
    </CoverRoot>
  )
}
