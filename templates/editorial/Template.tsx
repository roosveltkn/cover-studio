import { hexAlpha, readableOn, tone } from "@/lib/color"
import { fontStack } from "@/lib/fonts"
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

const COLUMN = { left: 130, top: 130, width: 940, height: 1240 }
const PANEL_LEFT = 1240
const PANEL_WIDTH = COVER_SIZE.width - PANEL_LEFT
const BROWSER = { left: 1400, top: 230, width: 1300 }
const BROWSER_CONTENT = { min: 700, max: 880, empty: 800 }
const PHONE = { left: 1110, top: 560, scale: 0.95 }
const MAX_FEATURES = 4
/** Débord des aplats hors du canevas natif, pour remplir les formats plus larges ou plus hauts. */
const BLEED = 1200

/**
 * Mise en page magazine façon suisse : colonne de texte sur fond papier,
 * index numéroté des fonctionnalités, aplat de marque à droite qui porte les mockups.
 */
export function EditorialTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const brand = style.brandColor
  const paper = tone(brand, 0.975, 0.06)
  const ink = tone(brand, 0.2, 0.25)
  const muted = tone(brand, 0.42, 0.2)
  const rule = hexAlpha(ink, 0.16)
  const accent = style.accentColor ?? readableOn(brand, paper)
  const scale = {
    badge: useTextScale("badge"),
    name: useTextScale("name"),
    description: useTextScale("description"),
    chips: useTextScale("chips"),
    footer: useTextScale("footer"),
  }
  const nameSize = nameFontSize(content, 132) * scale.name
  const features = content.chips.slice(0, MAX_FEATURES)

  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile
  const contentHeight = browserContentHeight(
    mockups.desktopImage,
    BROWSER.width,
    BROWSER_CONTENT
  )
  const browserTop = showMobile
    ? BROWSER.top
    : (COVER_SIZE.height - contentHeight - 60) / 2
  const phoneOnlyScale = 1.2

  return (
    <CoverRoot size={COVER_SIZE} style={{ background: paper }}>
      {/* Aplat de marque : déborde en haut, en bas et à droite pour les autres formats. */}
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT,
          top: -BLEED,
          bottom: -BLEED,
          right: -BLEED,
          background: `linear-gradient(160deg, ${brand} 0%, ${tone(brand, 0.42, 1)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT + PANEL_WIDTH / 2 - 620,
          top: COVER_SIZE.height / 2 - 620,
          width: 1240,
          height: 1240,
          borderRadius: "50%",
          border: "2px solid rgba(255, 255, 255, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT + PANEL_WIDTH / 2 - 400,
          top: COVER_SIZE.height / 2 - 400,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexAlpha(tone(brand, 0.85, 0.8), 0.35)} 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: COLUMN.left,
          top: COLUMN.top,
          width: COLUMN.width,
          height: COLUMN.height,
          display: "flex",
          flexDirection: "column",
          color: ink,
        }}
      >
        {/* Bloc principal centré verticalement, pied de page en bas. */}
        <div style={{ margin: "auto 0" }}>
          {content.badge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                color: accent,
                fontSize: 22 * scale.badge,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 6,
                  background: accent,
                  flexShrink: 0,
                }}
              />
              <EditableText field="badge" text={content.badge} />
            </div>
          )}

          <div
            style={{
              marginTop: 56,
              display: "flex",
              alignItems: "center",
              gap: nameSize * 0.28,
            }}
          >
            {content.icon && (
              <AppIcon
                image={content.icon}
                size={Math.round(nameSize * 1.05)}
              />
            )}
            <h1
              style={{
                margin: 0,
                minWidth: 0,
                fontSize: nameSize,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.045em",
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
                margin: "44px 0 0",
                paddingTop: 36,
                borderTop: `2px solid ${ink}`,
                fontSize: 33 * scale.description,
                lineHeight: 1.45,
                color: muted,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <EditableText field="description" text={content.description} />
            </p>
          )}

          {features.length > 0 && (
            <ol style={{ margin: "56px 0 0", padding: 0, listStyle: "none" }}>
              {features.map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 36,
                    padding: `${20 * scale.chips}px 0`,
                    borderTop: `2px solid ${rule}`,
                    borderBottom:
                      index === features.length - 1
                        ? `2px solid ${rule}`
                        : undefined,
                    fontSize: 30 * scale.chips,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontStack("geist-mono"),
                      fontSize: 22 * scale.chips,
                      color: accent,
                      flexShrink: 0,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <EditableText field="chips" text={feature} index={index} />
                </li>
              ))}
            </ol>
          )}
        </div>

        {content.footer && (
          <div
            style={{
              fontSize: 22 * scale.footer,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <EditableText field="footer" text={content.footer} />
          </div>
        )}
      </div>

      {showDesktop && (
        <BrowserFrame
          image={mockups.desktopImage}
          url={content.browserUrl}
          favicon={content.icon}
          theme={resolveBrowserTheme(mockups)}
          width={BROWSER.width}
          contentHeight={contentHeight}
          cropY={mockups.desktopCropY}
          style={{ position: "absolute", left: BROWSER.left, top: browserTop }}
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
                  left:
                    PANEL_LEFT +
                    (PANEL_WIDTH - PHONE_SIZE.width * phoneOnlyScale) / 2,
                  top:
                    (COVER_SIZE.height - PHONE_SIZE.height * phoneOnlyScale) /
                    2,
                }),
          }}
        />
      )}
    </CoverRoot>
  )
}
