import { hexAlpha, readableOn, tone } from "@/lib/color"
import { PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, phoneScreens } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const COLUMN = { left: 130, top: 320, width: 900 }
const TILT = "rotate(-14deg)"
/** Téléphones d'arrière-plan d'abord, le héros en dernier pour passer devant. */
const BACK = [
  { screen: 1, left: 1150, top: 380, scale: 1.12 },
  { screen: 2, left: 1990, top: 110, scale: 1.12 },
]
const HERO = { left: 1480, top: 290, scale: 1.45 }

/**
 * Un téléphone héros géant, incliné, qui sort par le bas du cadre, devant
 * deux autres écrans : scène sombre et halo de marque.
 */
export function FocusTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bg = tone(brand, 0.17, 0.6)
  const glow = tone(brand, 0.6, 1.1)
  const accent = style.accentColor ?? readableOn(tone(brand, 0.8, 1), bg)
  const screens = phoneScreens(mockups)

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bg,
        backgroundImage: [
          `radial-gradient(circle at 74% 58%, ${hexAlpha(glow, 0.6)} 0%, transparent 38%)`,
          `radial-gradient(ellipse 60% 70% at 100% 100%, ${hexAlpha(tone(brand, 0.35, 1), 0.7)} 0%, transparent 100%)`,
          `radial-gradient(ellipse 50% 50% at 0% 0%, ${hexAlpha(tone(brand, 0.3, 0.8), 0.5)} 0%, transparent 100%)`,
        ].join(", "),
      }}
    >
      {/* Anneaux concentriques derrière le héros. */}
      {[1100, 760].map((size) => (
        <div
          key={size}
          style={{
            position: "absolute",
            left: 1775 - size / 2,
            top: 870 - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${hexAlpha(glow, 0.3)}`,
          }}
        />
      ))}

      <TextBlock
        content={content}
        width={COLUMN.width}
        nameSize={118}
        chipRadius={999}
        colors={{
          text: "#ffffff",
          muted: "rgba(255, 255, 255, 0.76)",
          accent,
          badgeBorder: hexAlpha(accent, 0.55),
          badgeBg: hexAlpha(accent, 0.12),
          badgeText: accent,
          chipBg: "rgba(255, 255, 255, 0.08)",
          chipBorder: "rgba(255, 255, 255, 0.16)",
        }}
        style={{ position: "absolute", left: COLUMN.left, top: COLUMN.top }}
      />

      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.7)"
        style={{ left: COLUMN.left, bottom: 100, width: COLUMN.width }}
      />

      {BACK.map(({ screen, left, top, scale }) => (
        <PhoneFrame
          key={screen}
          image={screens[screen].image}
          imagePosition={screens[screen].position}
          scale={scale}
          style={{ position: "absolute", left, top, transform: TILT, opacity: 0.92 }}
        />
      ))}

      <PhoneFrame
        image={screens[0].image}
        scale={HERO.scale}
        style={{
          position: "absolute",
          left: HERO.left,
          top: HERO.top,
          transform: TILT,
          boxShadow: `0 80px 160px rgba(0, 0, 0, 0.6), 0 0 140px ${hexAlpha(glow, 0.45)}`,
        }}
      />
    </CoverRoot>
  )
}
