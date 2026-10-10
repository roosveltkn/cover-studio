import type { CSSProperties } from "react"

import { hexAlpha, readableOn, tone } from "@/lib/color"
import { fontStack } from "@/lib/fonts"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import { COVER_SIZE, resolveBrowserTheme } from "@/templates/shared/mockups"
import {
  AppIcon,
  CoverRoot,
  Footer,
  nameFontSize,
  useTextScale,
} from "@/templates/shared/text-block"
import { EditableText } from "@/templates/shared/editable"
import type { PlacedConfig } from "@/types/cover"

const GUIDE = 140
const TEXT = { top: 230, width: 1700 }
const BROWSER = { width: 1640, contentHeight: 1000 }
const DOT_CELL = 48
const BLEED = 1200
const LINE = "rgba(255, 255, 255, 0.1)"

/**
 * Esthétique d'outil de développeur : fond quasi noir à trame de points,
 * lignes de repère et croix d'alignement, étiquettes en monospace,
 * faisceau de lumière de marque sur un grand navigateur centré.
 */
export function TerminalTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const bg = tone(brand, 0.14, 0.12)
  const glow = tone(brand, 0.64, 1.1)
  const light = tone(brand, 0.86, 0.7)
  const accent = style.accentColor ?? readableOn(tone(brand, 0.76, 1.1), bg)
  const mono = fontStack("geist-mono")

  const scale = {
    badge: useTextScale("badge"),
    name: useTextScale("name"),
    description: useTextScale("description"),
    chips: useTextScale("chips"),
  }
  const nameSize = nameFontSize(content, 124) * scale.name

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const mockupTop = content.chips.length > 0 ? 780 : 690
  const browserLeft = (COVER_SIZE.width - BROWSER.width) / 2

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bg,
        backgroundImage: [
          `radial-gradient(ellipse 50% 45% at 50% 0%, ${hexAlpha(glow, 0.4)} 0%, transparent 100%)`,
          `radial-gradient(ellipse 45% 40% at 50% 85%, ${hexAlpha(glow, 0.28)} 0%, transparent 100%)`,
          `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.6px, transparent 2.2px)`,
        ].join(", "),
        backgroundSize: `100% 100%, 100% 100%, ${DOT_CELL}px ${DOT_CELL}px`,
      }}
    >
      {/* Lignes de repère : prolongées hors du canevas natif pour les autres formats. */}
      <Rule style={{ left: -BLEED, right: -BLEED, top: GUIDE, height: 1.5 }} />
      <Rule style={{ top: -BLEED, bottom: -BLEED, left: GUIDE, width: 1.5 }} />
      <Rule style={{ top: -BLEED, bottom: -BLEED, right: GUIDE, width: 1.5 }} />
      <Cross x={GUIDE} y={GUIDE} />
      <Cross x={COVER_SIZE.width - GUIDE} y={GUIDE} />

      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.55)"
        style={{
          left: GUIDE + 32,
          top: 62,
          maxWidth: 1200,
          fontSize: 22,
          fontFamily: mono,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: (COVER_SIZE.width - TEXT.width) / 2,
          top: TEXT.top,
          width: TEXT.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        {content.badge && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: 56 * scale.badge,
              padding: `0 ${26 * scale.badge}px`,
              borderRadius: 999,
              border: `1.5px solid ${hexAlpha(glow, 0.55)}`,
              background: hexAlpha(glow, 0.1),
              color: light,
              fontFamily: mono,
              fontSize: 21 * scale.badge,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: glow,
                boxShadow: `0 0 14px ${glow}`,
                flexShrink: 0,
              }}
            />
            <EditableText field="badge" text={content.badge} />
          </div>
        )}

        <div
          style={{
            marginTop: 44,
            display: "flex",
            alignItems: "center",
            gap: nameSize * 0.28,
          }}
        >
          {content.icon && (
            <AppIcon image={content.icon} size={Math.round(nameSize * 1.05)} />
          )}
          <h1
            style={{
              margin: 0,
              minWidth: 0,
              fontSize: nameSize,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              overflowWrap: "anywhere",
            }}
          >
            <EditableText field="nameMain" text={content.nameMain} />
            {content.nameAccent && (
              <span style={{ color: accent }}>
                <EditableText field="nameAccent" text={content.nameAccent} colorable={false} />
              </span>
            )}
          </h1>
        </div>

        {content.description && (
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: 1340,
              fontSize: 31 * scale.description,
              lineHeight: 1.45,
              color: "rgba(255, 255, 255, 0.64)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <EditableText field="description" text={content.description} />
          </p>
        )}

        {content.chips.length > 0 && (
          <div
            style={{
              marginTop: 44,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
              maxHeight: 60 * scale.chips,
              overflow: "hidden",
            }}
          >
            {content.chips.map((chip, index) => (
              <span
                key={`${chip}-${index}`}
                style={{
                  height: 52 * scale.chips,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: `0 ${20 * scale.chips}px`,
                  borderRadius: 8,
                  border: `1.5px solid ${LINE}`,
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "rgba(255, 255, 255, 0.82)",
                  fontFamily: mono,
                  fontSize: 20 * scale.chips,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: glow,
                    flexShrink: 0,
                  }}
                />
                <EditableText field="chips" text={chip} index={index} />
              </span>
            ))}
          </div>
        )}
      </div>

      {showDesktop && (
        <>
          <BrowserFrame
            image={mockups.desktopImage}
            url={content.browserUrl}
            favicon={content.icon}
            theme={resolveBrowserTheme(mockups)}
            width={BROWSER.width}
            contentHeight={BROWSER.contentHeight}
            cropY={mockups.desktopCropY}
            style={{
              position: "absolute",
              left: browserLeft,
              top: mockupTop,
              boxShadow: `0 0 0 1.5px rgba(255, 255, 255, 0.12), 0 -30px 140px ${hexAlpha(glow, 0.35)}, 0 40px 120px rgba(0, 0, 0, 0.6)`,
            }}
          />
          {/* Liseré lumineux sur le bord haut du navigateur. */}
          <div
            style={{
              position: "absolute",
              left: browserLeft + 120,
              top: mockupTop - 1,
              width: BROWSER.width - 240,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${light}, transparent)`,
            }}
          />
        </>
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={showDesktop ? 0.82 : 1}
          style={{
            position: "absolute",
            left: showDesktop
              ? browserLeft + BROWSER.width - PHONE_SIZE.width * 0.82 + 70
              : (COVER_SIZE.width - PHONE_SIZE.width) / 2,
            top: showDesktop ? mockupTop + 150 : mockupTop,
            boxShadow: `0 0 0 1.5px rgba(255, 255, 255, 0.12), 0 50px 100px rgba(0, 0, 0, 0.6)`,
          }}
        />
      )}
    </CoverRoot>
  )
}

function Rule({ style }: { style: CSSProperties }) {
  return <div style={{ position: "absolute", background: LINE, ...style }} />
}

/** Croix d'alignement centrée sur (x, y). */
function Cross({ x, y }: { x: number; y: number }) {
  const arm = 22
  const color = "rgba(255, 255, 255, 0.5)"
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - arm,
          top: y - 1,
          width: arm * 2,
          height: 2,
          background: color,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 1,
          top: y - arm,
          width: 2,
          height: arm * 2,
          background: color,
        }}
      />
    </>
  )
}
