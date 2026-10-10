import { contrast, hexAlpha, hexToOklch, tone } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import {
  AppIcon,
  CoverRoot,
  nameFontSize,
  useTextScale,
} from "@/templates/shared/text-block"
import { EditableText } from "@/templates/shared/editable"
import type { PlacedConfig } from "@/types/cover"

const INK = "#111111"
const BORDER = `5px solid ${INK}`
const COLUMN = { left: 1470, top: 80, width: 820 }
const BROWSER = { left: 110, top: 160, width: 1240 }
const BROWSER_CONTENT = { min: 660, max: 780, empty: 740 }
const PHONE = { left: 1030, top: 560, scale: 0.88 }
const STRIP_HEIGHT = 96
const DOT_CELL = 44
const BLEED = 1200

/**
 * Néo-brutalisme : contours noirs épais, ombres pleines décalées, pastille
 * autocollant et bandeau défilant. Mockups à gauche, texte à droite.
 */
export function BrutalTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const background = tone(brand, 0.95, 0.35)
  const onBrand =
    contrast(brand, INK) >= contrast(brand, "#ffffff") ? INK : "#ffffff"
  // Autocollant jaune, rose si la marque est déjà dans les jaunes.
  const hue = hexToOklch(brand).h ?? 0
  const sticker =
    style.accentColor ?? (Math.abs(hue - 100) < 40 ? "#ff9ecd" : "#ffd84d")
  const chipFills = ["#ffffff", sticker, brand]

  const scale = {
    badge: useTextScale("badge"),
    name: useTextScale("name"),
    description: useTextScale("description"),
    chips: useTextScale("chips"),
    footer: useTextScale("footer"),
  }
  const nameSize = nameFontSize(content, 118) * scale.name

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const contentHeight = browserContentHeight(
    mockups.desktopImage,
    BROWSER.width,
    BROWSER_CONTENT
  )
  const phoneOnlyScale = 1.1

  return (
    <CoverRoot
      size={COVER_SIZE}
      style={{
        backgroundColor: background,
        backgroundImage: `radial-gradient(circle, ${hexAlpha(INK, 0.14)} 2px, transparent 2.5px)`,
        backgroundSize: `${DOT_CELL}px ${DOT_CELL}px`,
      }}
    >
      {/* Formes décoratives derrière les mockups. */}
      <div
        style={{
          position: "absolute",
          left: -90,
          top: 930,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: sticker,
          border: BORDER,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1090,
          top: 70,
          width: 300,
          height: 300,
          borderRadius: 40,
          background: brand,
          border: BORDER,
          transform: "rotate(12deg)",
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
            top: showMobile
              ? BROWSER.top
              : (COVER_SIZE.height - STRIP_HEIGHT - contentHeight - 60) / 2,
            border: BORDER,
            borderRadius: 20,
            boxShadow: `18px 18px 0 ${INK}`,
          }}
        />
      )}

      {showMobile && (
        <PhoneFrame
          image={mockups.mobileImage}
          scale={showDesktop ? PHONE.scale : phoneOnlyScale}
          style={{
            position: "absolute",
            ...(showDesktop
              ? { left: PHONE.left, top: PHONE.top }
              : {
                  left: (COLUMN.left - PHONE_SIZE.width * phoneOnlyScale) / 2,
                  top:
                    (COVER_SIZE.height -
                      STRIP_HEIGHT -
                      PHONE_SIZE.height * phoneOnlyScale) /
                    2,
                }),
            transform: "rotate(5deg)",
            boxShadow: `16px 16px 0 ${INK}`,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: COLUMN.left,
          top: COLUMN.top,
          width: COLUMN.width,
          height: COVER_SIZE.height - STRIP_HEIGHT - COLUMN.top * 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          color: INK,
        }}
      >
        {content.badge && (
          <div
            style={{
              padding: `${14 * scale.badge}px ${28 * scale.badge}px`,
              background: sticker,
              border: `4px solid ${INK}`,
              borderRadius: 14,
              boxShadow: `6px 6px 0 ${INK}`,
              transform: "rotate(-3deg)",
              fontSize: 24 * scale.badge,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <EditableText field="badge" text={content.badge} />
          </div>
        )}

        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            gap: nameSize * 0.25,
          }}
        >
          {content.icon && (
            <AppIcon
              image={content.icon}
              size={Math.round(nameSize * 1.05)}
              style={{
                border: `4px solid ${INK}`,
                boxShadow: `6px 6px 0 ${INK}`,
              }}
            />
          )}
          <h1
            style={{
              margin: 0,
              minWidth: 0,
              fontSize: nameSize,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              overflowWrap: "anywhere",
            }}
          >
            <EditableText field="nameMain" text={content.nameMain} />
            {content.nameAccent && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "0.08em",
                  padding: "0 0.16em",
                  background: brand,
                  color: onBrand,
                  border: BORDER,
                  borderRadius: 14,
                  transform: "rotate(-2deg)",
                }}
              >
                <EditableText field="nameAccent" text={content.nameAccent} colorable={false} />
              </span>
            )}
          </h1>
        </div>

        {content.description && (
          <p
            style={{
              margin: "40px 0 0",
              fontSize: 31 * scale.description,
              fontWeight: 500,
              lineHeight: 1.45,
              color: hexAlpha(INK, 0.82),
              display: "-webkit-box",
              WebkitLineClamp: 4,
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
              marginTop: 52,
              display: "flex",
              flexWrap: "wrap",
              gap: "22px 20px",
            }}
          >
            {content.chips.map((chip, index) => {
              const fill = chipFills[index % chipFills.length]
              return (
                <span
                  key={`${chip}-${index}`}
                  style={{
                    height: 60 * scale.chips,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: `0 ${24 * scale.chips}px`,
                    background: fill,
                    color: fill === brand ? onBrand : INK,
                    border: `3px solid ${INK}`,
                    borderRadius: 10,
                    boxShadow: `5px 5px 0 ${INK}`,
                    fontSize: 23 * scale.chips,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    maxWidth: COLUMN.width,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <EditableText field="chips" text={chip} index={index} />
                </span>
              )
            })}
          </div>
        )}
      </div>

      {content.footer && (
        <div
          style={{
            position: "absolute",
            left: -BLEED,
            right: -BLEED,
            bottom: 0,
            height: STRIP_HEIGHT,
            background: INK,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            fontSize: 28 * scale.footer,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              style={{ display: "inline-flex", alignItems: "center", gap: 40 }}
            >
              <EditableText field="footer" text={content.footer} />
              <span style={{ color: sticker }}>✦</span>
            </span>
          ))}
        </div>
      )}
    </CoverRoot>
  )
}
