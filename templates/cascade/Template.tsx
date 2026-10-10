import { hexAlpha, readableOn, tone } from "@/lib/color"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, phoneScreens } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const COLUMN = { left: 1460, width: 820 }
const STEP = { x: 340, y: 175 }
const ORIGIN = { left: 130, top: 500 }
const PHONE_SCALE = 1
/** De l'arrière vers l'avant : la capture principale est la marche la plus haute. */
const ORDER = [2, 1, 0]

/**
 * Trois téléphones en escalier montant vers la droite, sur un fond clair
 * rayé en diagonale ; texte à droite.
 */
export function CascadeTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bgTop = tone(brand, 0.97, 0.2)
  const bgBottom = tone(brand, 0.88, 0.55)
  const ink = tone(brand, 0.22, 0.5)
  const accent = style.accentColor ?? readableOn(brand, bgTop)
  const screens = phoneScreens(mockups)
  const phoneHeight = PHONE_SIZE.height * PHONE_SCALE

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundImage: [
          `repeating-linear-gradient(-32deg, ${hexAlpha(brand, 0.05)} 0px, ${hexAlpha(brand, 0.05)} 2px, transparent 2px, transparent 46px)`,
          `radial-gradient(ellipse 50% 60% at 30% 60%, ${hexAlpha(brand, 0.28)} 0%, transparent 100%)`,
          `linear-gradient(160deg, ${bgTop} 0%, ${bgBottom} 100%)`,
        ].join(", "),
      }}
    >
      {/* Ombre portée commune au pied de l'escalier. */}
      <div
        style={{
          position: "absolute",
          left: ORIGIN.left - 40,
          top: ORIGIN.top + phoneHeight - 60,
          width: STEP.x * 2 + PHONE_SIZE.width + 80,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${hexAlpha(tone(brand, 0.25, 0.8), 0.35)} 0%, transparent 70%)`,
          transform: `rotate(${-Math.atan2(STEP.y, STEP.x) * (180 / Math.PI)}deg)`,
          transformOrigin: "0% 50%",
        }}
      />

      {ORDER.map((screen, step) => (
        <PhoneFrame
          key={screen}
          image={screens[screen].image}
          imagePosition={screens[screen].position}
          scale={PHONE_SCALE}
          style={{
            position: "absolute",
            left: ORIGIN.left + step * STEP.x,
            top: ORIGIN.top - step * STEP.y,
            boxShadow: `-30px 40px 80px ${hexAlpha(tone(brand, 0.2, 0.8), 0.35)}, 0 14px 30px rgba(0, 0, 0, 0.25)`,
          }}
        />
      ))}

      <TextBlock
        content={content}
        width={COLUMN.width}
        nameSize={104}
        descriptionLines={4}
        chipRadius={999}
        colors={{
          text: ink,
          muted: tone(brand, 0.4, 0.35),
          accent,
          badgeBorder: tone(brand, 0.8, 0.6),
          badgeBg: "rgba(255, 255, 255, 0.7)",
          badgeText: readableOn(brand, "#ffffff"),
          chipBg: "#ffffff",
          chipText: ink,
          chipBorder: tone(brand, 0.86, 0.5),
        }}
        style={{
          position: "absolute",
          left: COLUMN.left,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <Footer
        text={content.footer}
        color={tone(brand, 0.4, 0.35)}
        style={{ left: COLUMN.left, bottom: 100, width: COLUMN.width }}
      />
    </CoverRoot>
  )
}
