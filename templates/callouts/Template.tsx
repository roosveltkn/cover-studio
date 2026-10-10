import { Check } from "lucide-react"

import { contrast, hexAlpha, readableOn, tone } from "@/lib/color"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE } from "@/templates/shared/mockups"
import { CoverRoot, Footer, TextBlock, useTextScale } from "@/templates/shared/text-block"
import { EditableText } from "@/templates/shared/editable"
import type { PlacedConfig } from "@/types/cover"

const COLUMN = { left: 120, top: 360, width: 760 }
const PHONE_SCALE = 1.3
const PHONE_CENTER = 1560
/** Bulles de fonctionnalités autour du téléphone, dans l'ordre des chips. */
const CALLOUTS: { left?: number; right?: number; top: number; tilt: number }[] = [
  { right: 2400 - 1340, top: 330, tilt: -3 },
  { left: 1760, top: 560, tilt: 2.5 },
  { right: 2400 - 1300, top: 960, tilt: 2 },
  { left: 1790, top: 1130, tilt: -2.5 },
]

/**
 * Un téléphone sur un disque de couleur, entouré de bulles qui reprennent les
 * fonctionnalités (chips) : style annotation de maquette.
 */
export function CalloutsTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const background = tone(brand, 0.955, 0.3)
  const ink = tone(brand, 0.22, 0.5)
  const accent = style.accentColor ?? readableOn(brand, background)
  const onBrand = contrast(brand, "#ffffff") >= contrast(brand, ink) ? "#ffffff" : ink
  const chipsScale = useTextScale("chips")
  const phoneWidth = PHONE_SIZE.width * PHONE_SCALE
  const phoneHeight = PHONE_SIZE.height * PHONE_SCALE

  return (
    <CoverRoot size={COVER_SIZE} style={{ background }}>
      <div
        style={{
          position: "absolute",
          left: PHONE_CENTER - 620,
          top: COVER_SIZE.height / 2 - 620,
          width: 1240,
          height: 1240,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${tone(brand, 0.86, 0.6)} 0%, ${tone(brand, 0.74, 0.9)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PHONE_CENTER - 760,
          top: COVER_SIZE.height / 2 - 760,
          width: 1520,
          height: 1520,
          borderRadius: "50%",
          border: `2px dashed ${hexAlpha(brand, 0.3)}`,
        }}
      />

      <TextBlock
        content={content}
        width={COLUMN.width}
        nameSize={108}
        descriptionLines={4}
        hideChips
        colors={{
          text: ink,
          muted: tone(brand, 0.4, 0.35),
          accent,
          badgeBorder: tone(brand, 0.8, 0.6),
          badgeBg: "#ffffff",
          badgeText: readableOn(brand, "#ffffff"),
          chipBg: "transparent",
        }}
        style={{ position: "absolute", left: COLUMN.left, top: COLUMN.top }}
      />

      <Footer
        text={content.footer}
        color={tone(brand, 0.4, 0.35)}
        style={{ left: COLUMN.left, bottom: 100, width: COLUMN.width }}
      />

      <PhoneFrame
        image={mockups.mobileImage}
        scale={PHONE_SCALE}
        style={{
          position: "absolute",
          left: PHONE_CENTER - phoneWidth / 2,
          top: (COVER_SIZE.height - phoneHeight) / 2,
        }}
      />

      {content.chips.slice(0, CALLOUTS.length).map((chip, index) => {
        const { tilt, ...position } = CALLOUTS[index]
        return (
          <div
            key={`${chip}-${index}`}
            style={{
              position: "absolute",
              ...position,
              maxWidth: 560,
              display: "flex",
              alignItems: "center",
              gap: 18 * chipsScale,
              padding: `${20 * chipsScale}px ${30 * chipsScale}px ${20 * chipsScale}px ${20 * chipsScale}px`,
              borderRadius: 28,
              background: "#ffffff",
              color: ink,
              boxShadow: `0 24px 60px ${hexAlpha(tone(brand, 0.25, 0.8), 0.22)}, 0 4px 12px rgba(0, 0, 0, 0.06)`,
              transform: `rotate(${tilt}deg)`,
              fontSize: 28 * chipsScale,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 48 * chipsScale,
                height: 48 * chipsScale,
                flexShrink: 0,
                borderRadius: "50%",
                background: brand,
                color: onBrand,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Check size={28 * chipsScale} strokeWidth={3} />
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              <EditableText field="chips" text={chip} index={index} />
            </span>
          </div>
        )
      })}
    </CoverRoot>
  )
}
