import { hexAlpha, readableOn, tone } from "@/lib/color"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock } from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const TEXT = { top: 90, width: 1700 }
const CENTER_SCALE = 1.05
const SIDE_SCALE = 0.92
const SIDE_OFFSET = 560
const SIDE_TILT = 9

/**
 * Pour les apps mobiles : texte centré en haut, trois téléphones en éventail.
 * Sans 2e et 3e capture, les téléphones latéraux montrent d'autres cadrages
 * de la capture principale.
 */
export function MobileTrioTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bgTop = tone(brand, 0.965, 0.3)
  const bgBottom = tone(brand, 0.84, 0.75)
  const ink = tone(brand, 0.22, 0.5)
  const accent = style.accentColor ?? readableOn(brand, bgTop)

  const phonesTop = content.chips.length > 0 ? 700 : 610
  const centerLeft = (COVER_SIZE.width - PHONE_SIZE.width * CENTER_SCALE) / 2
  const sideTop = phonesTop + 120
  const main = mockups.mobileImage

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundImage: [
          `radial-gradient(circle at 50% 118%, ${hexAlpha(brand, 0.55)} 0%, ${hexAlpha(brand, 0)} 42%)`,
          `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
        ].join(", "),
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
          badgeBorder: tone(brand, 0.78, 0.6),
          badgeBg: "rgba(255, 255, 255, 0.6)",
          badgeText: readableOn(brand, "#ffffff"),
          chipBg: "rgba(255, 255, 255, 0.75)",
          chipText: ink,
        }}
        style={{ position: "absolute", left: (COVER_SIZE.width - TEXT.width) / 2, top: TEXT.top }}
      />

      <PhoneFrame
        image={mockups.mobileImage2 ?? main}
        imagePosition={mockups.mobileImage2 ? "top" : "50%"}
        scale={SIDE_SCALE}
        style={{
          position: "absolute",
          left: centerLeft - SIDE_OFFSET + 40,
          top: sideTop,
          transform: `rotate(-${SIDE_TILT}deg)`,
        }}
      />
      <PhoneFrame
        image={mockups.mobileImage3 ?? main}
        imagePosition={mockups.mobileImage3 ? "top" : "100%"}
        scale={SIDE_SCALE}
        style={{
          position: "absolute",
          left: centerLeft + SIDE_OFFSET,
          top: sideTop,
          transform: `rotate(${SIDE_TILT}deg)`,
        }}
      />
      <PhoneFrame
        image={main}
        scale={CENTER_SCALE}
        style={{ position: "absolute", left: centerLeft, top: phonesTop }}
      />
    </CoverRoot>
  )
}
