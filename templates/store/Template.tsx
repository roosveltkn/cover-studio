import { hexAlpha, readableOn, tone } from "@/lib/color"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, phoneScreens } from "@/templates/shared/mockups"
import {
  AppIcon,
  CoverRoot,
  Footer,
  nameFontSize,
  useTextScale,
} from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const PAD = 110
const GAP = 40
const PANELS_TOP = 380
const PANEL_WIDTH = (COVER_SIZE.width - PAD * 2 - GAP * 2) / 3
const PANEL_HEIGHT = COVER_SIZE.height - PANELS_TOP - 80
const PHONE_SCALE = 0.95
/** Le téléphone sort par le bas de son panneau, comme sur les fiches des stores. */
const PHONE_TOP = 200

/**
 * Planche de captures façon App Store : trois panneaux de couleur, chacun
 * avec un téléphone et une légende (les chips, dans l'ordre).
 */
export function StoreTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const background = tone(brand, 0.965, 0.2)
  const ink = tone(brand, 0.2, 0.45)
  const accent = style.accentColor ?? readableOn(brand, background)
  const scale = {
    badge: useTextScale("badge"),
    description: useTextScale("description"),
    chips: useTextScale("chips"),
  }
  const nameSize = nameFontSize(content, 88) * useTextScale("name")

  // Fond du panneau et couleur de sa légende : marque, clair, sombre.
  const strong = readableOn(brand, "#ffffff")
  const panels = [
    { bg: `linear-gradient(170deg, ${strong} 0%, ${tone(brand, 0.38, 1)} 100%)`, text: "#ffffff" },
    { bg: `linear-gradient(170deg, ${tone(brand, 0.9, 0.55)} 0%, ${tone(brand, 0.82, 0.8)} 100%)`, text: ink },
    { bg: `linear-gradient(170deg, ${tone(brand, 0.28, 0.6)} 0%, ${tone(brand, 0.16, 0.5)} 100%)`, text: "#ffffff" },
  ]
  const screens = phoneScreens(mockups)

  return (
    <CoverRoot size={COVER_SIZE} style={{ background }}>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: 96,
          width: 1150,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          color: ink,
        }}
      >
        {content.badge && (
          <span
            style={{
              alignSelf: "flex-start",
              padding: `${10 * scale.badge}px ${22 * scale.badge}px`,
              borderRadius: 999,
              background: hexAlpha(accent, 0.1),
              color: accent,
              fontSize: 21 * scale.badge,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {content.badge}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: nameSize * 0.25 }}>
          {content.icon && <AppIcon image={content.icon} size={Math.round(nameSize * 1.05)} />}
          <h1
            style={{
              margin: 0,
              minWidth: 0,
              fontSize: nameSize,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {content.nameMain}
            {content.nameAccent && <span style={{ color: accent }}>{content.nameAccent}</span>}
          </h1>
        </div>
      </div>

      {content.description && (
        <p
          style={{
            position: "absolute",
            right: PAD,
            top: 196,
            width: 900,
            margin: 0,
            textAlign: "right",
            fontSize: 30 * scale.description,
            lineHeight: 1.45,
            color: tone(brand, 0.42, 0.3),
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {content.description}
        </p>
      )}

      <Footer
        text={content.footer}
        color={tone(brand, 0.42, 0.3)}
        style={{ right: PAD, top: 120, maxWidth: 900, fontSize: 22, textAlign: "right" }}
      />

      {panels.map((panel, index) => {
        const caption = content.chips[index]
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: PAD + index * (PANEL_WIDTH + GAP),
              top: PANELS_TOP,
              width: PANEL_WIDTH,
              height: PANEL_HEIGHT,
              borderRadius: 48,
              overflow: "hidden",
              background: panel.bg,
            }}
          >
            {caption && (
              <div
                style={{
                  position: "absolute",
                  left: 48,
                  right: 48,
                  top: 54,
                  textAlign: "center",
                  color: panel.text,
                  fontSize: 40 * scale.chips,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {caption}
              </div>
            )}
            <PhoneFrame
              image={screens[index].image}
              imagePosition={screens[index].position}
              scale={PHONE_SCALE}
              style={{
                position: "absolute",
                left: (PANEL_WIDTH - PHONE_SIZE.width * PHONE_SCALE) / 2,
                top: caption ? PHONE_TOP : PHONE_TOP - 90,
              }}
            />
          </div>
        )
      })}
    </CoverRoot>
  )
}
