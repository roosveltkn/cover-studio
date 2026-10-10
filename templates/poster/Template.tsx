import { hexAlpha, readableOn, tone } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import {
  AppIcon,
  Chips,
  CoverRoot,
  Footer,
  nameFontSize,
  useTextScale,
} from "@/templates/shared/text-block"
import type { PlacedConfig } from "@/types/cover"

const PAD = 120
const BAND_TOP = 1170
const GIANT_SIZE = 420
const GIANT_ROWS = [-60, 340, 740]
const DESCRIPTION = { left: 1360, width: 920 }

/**
 * Affiche typographique : fond de marque plein, nom de l'app répété en très
 * grand derrière les mockups, légende en deux colonnes sous un filet.
 */
export function PosterTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  // Fond assez soutenu pour porter du texte blanc en AA.
  const bg = readableOn(brand, "#ffffff")
  const accent = style.accentColor ?? tone(brand, 0.88, 0.7)
  const badgeScale = useTextScale("badge")
  const descriptionScale = useTextScale("description")
  const chipsScale = useTextScale("chips")
  const nameSize = nameFontSize(content, 112) * useTextScale("name")
  const giant = `${content.nameMain}${content.nameAccent ?? ""}`.toUpperCase()

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const both = showDesktop && showMobile
  const browser = both
    ? { left: 380, top: 220, width: 1380 }
    : { left: 420, top: 200, width: 1560 }
  const contentHeight = browserContentHeight(
    mockups.desktopImage,
    browser.width,
    {
      min: 640,
      max: both ? 780 : 860,
      empty: 760,
    }
  )
  const phoneScale = both ? 0.88 : 0.98

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: bg,
        backgroundImage: [
          `radial-gradient(ellipse 45% 50% at 50% 42%, ${hexAlpha(tone(brand, 0.75, 1), 0.45)} 0%, transparent 100%)`,
          `linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.22) 100%)`,
        ].join(", "),
      }}
    >
      {GIANT_ROWS.map((top, index) => (
        <div
          key={top}
          aria-hidden
          style={{
            position: "absolute",
            top,
            left: index % 2 === 0 ? -260 : -720,
            fontSize: GIANT_SIZE,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
            color: index === 1 ? "transparent" : "rgba(255, 255, 255, 0.07)",
            WebkitTextStroke:
              index === 1 ? "3px rgba(255, 255, 255, 0.22)" : undefined,
          }}
        >
          {Array.from({ length: 4 }, () => giant).join(" ")}
        </div>
      ))}

      {content.badge && (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 90,
            height: 56 * badgeScale,
            display: "flex",
            alignItems: "center",
            padding: `0 ${26 * badgeScale}px`,
            borderRadius: 999,
            background: "#ffffff",
            color: bg,
            fontSize: 21 * badgeScale,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            maxWidth: 900,
            overflow: "hidden",
          }}
        >
          {content.badge}
        </div>
      )}

      <Footer
        text={content.footer}
        color="rgba(255, 255, 255, 0.85)"
        style={{
          right: PAD,
          top: 102,
          maxWidth: 900,
          fontSize: 24,
          textAlign: "right",
        }}
      />

      {showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          favicon={content.icon}
          theme={resolveBrowserTheme(mockups)}
          width={browser.width}
          contentHeight={contentHeight}
          cropY={mockups.desktopCropY}
          style={{ position: "absolute", left: browser.left, top: browser.top }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={phoneScale}
          style={{
            position: "absolute",
            left: both
              ? 1650
              : (COVER_SIZE.width - PHONE_SIZE.width * phoneScale) / 2,
            top: both ? 300 : 210,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          top: BAND_TOP,
          height: 2,
          background: "rgba(255, 255, 255, 0.4)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: PAD,
          top: BAND_TOP + 48,
          width: DESCRIPTION.left - PAD - 80,
          display: "flex",
          alignItems: "center",
          gap: nameSize * 0.28,
          color: "#ffffff",
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
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            overflowWrap: "anywhere",
          }}
        >
          {content.nameMain}
          {content.nameAccent && (
            <span style={{ color: accent }}>{content.nameAccent}</span>
          )}
        </h1>
      </div>

      <div
        style={{
          position: "absolute",
          left: DESCRIPTION.left,
          top: BAND_TOP + 46,
          width: DESCRIPTION.width,
        }}
      >
        {content.description && (
          <p
            style={{
              margin: 0,
              fontSize: 29 * descriptionScale,
              lineHeight: 1.45,
              color: "rgba(255, 255, 255, 0.9)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {content.description}
          </p>
        )}
        {content.chips.length > 0 && (
          <Chips
            chips={content.chips}
            radius={999}
            maxWidth={DESCRIPTION.width}
            colors={{
              text: "#ffffff",
              chipBg: "rgba(255, 255, 255, 0.12)",
              chipBorder: "rgba(255, 255, 255, 0.35)",
            }}
            style={{
              marginTop: 26,
              maxHeight: 58 * chipsScale,
              overflow: "hidden",
            }}
          />
        )}
      </div>
    </CoverRoot>
  )
}
