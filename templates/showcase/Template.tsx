import type { CSSProperties } from "react"

import { clamp } from "@/lib/color"
import { BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import type { CoverConfig } from "@/types/cover"

import { derivePalette } from "./palette"

export const SHOWCASE_SIZE = { width: 2400, height: 1500 }

const COLUMN = { left: 135, top: 285, width: 720 }
const BROWSER = { left: 900, top: 180, width: 1290 }
const BROWSER_CONTENT = { min: 700, max: 960, empty: 860 }
const PHONE = { left: 1907, top: 510 }
const GRID_CELL = 58

export function ShowcaseTemplate({ config }: { config: CoverConfig }) {
  const { content, style, mockups } = config
  const palette = derivePalette(style.brandColor, style.accentColor)
  const haloIntensity = style.haloIntensity ?? 0.35
  const gridOpacity = style.gridOpacity ?? 0.045

  const desktop = mockups.desktopImage
  const mobile = mockups.mobileImage
  const contentHeight = desktop
    ? clamp(
        Math.round((BROWSER.width * desktop.height) / desktop.width),
        BROWSER_CONTENT.min,
        BROWSER_CONTENT.max
      )
    : BROWSER_CONTENT.empty
  const browserTheme =
    mockups.browserTheme && mockups.browserTheme !== "auto"
      ? mockups.browserTheme
      : desktop && desktop.luminance < 0.4
        ? "dark"
        : "light"

  const phoneOnly = mockups.showMobile && !mockups.showDesktop
  const phonePosition = phoneOnly
    ? {
        left: (BROWSER.left + PHONE.left + PHONE_SIZE.width) / 2 - PHONE_SIZE.width / 2,
        top: (SHOWCASE_SIZE.height - PHONE_SIZE.height) / 2,
      }
    : PHONE

  const name = `${content.nameMain}${content.nameAccent ?? ""}`
  const nameSize = name.length <= 12 ? 102 : Math.max(68, (102 * 12) / name.length)

  const grid = `rgba(255, 255, 255, ${gridOpacity})`
  const background = [
    `linear-gradient(${grid} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
    `radial-gradient(ellipse 40% 45% at 100% 0%, ${hexAlpha(palette.halo, haloIntensity)} 0%, transparent 100%)`,
    palette.shade,
  ].join(", ")

  return (
    <div
      style={{
        ...SHOWCASE_SIZE,
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        fontFamily: "var(--font-poppins), sans-serif",
        backgroundColor: palette.base,
        backgroundImage: background,
        backgroundSize: `${GRID_CELL}px ${GRID_CELL}px, ${GRID_CELL}px ${GRID_CELL}px, 100% 100%, 100% 100%`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: COLUMN.left,
          top: COLUMN.top,
          width: COLUMN.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {content.badge && (
          <div
            style={{
              height: 61,
              display: "flex",
              alignItems: "center",
              padding: "0 27px",
              borderRadius: 999,
              border: `2px solid ${palette.badgeBorder}`,
              background: palette.badgeBg,
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            {content.badge}
          </div>
        )}

        <h1
          style={{
            margin: "38px 0 0",
            fontSize: nameSize,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            overflowWrap: "anywhere",
          }}
        >
          {content.nameMain}
          {content.nameAccent && (
            <span style={{ color: palette.nameAccent }}>{content.nameAccent}</span>
          )}
        </h1>

        {content.description && (
          <p
            style={{
              margin: "22px 0 0",
              fontSize: 31,
              lineHeight: 1.45,
              color: "rgba(255, 255, 255, 0.92)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {content.description}
          </p>
        )}

        {content.chips.length > 0 && (
          <div
            style={{
              marginTop: 50,
              display: "flex",
              flexWrap: "wrap",
              gap: "16px 15px",
            }}
          >
            {content.chips.map((chip, index) => (
              <span key={`${chip}-${index}`} style={chipStyle(palette.chipBg)}>
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {content.footer && (
        <div
          style={{
            position: "absolute",
            left: COLUMN.left,
            bottom: 105,
            width: COLUMN.width,
            fontSize: 26,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {content.footer}
        </div>
      )}

      {mockups.showDesktop && (
        <BrowserFrame
          image={desktop}
          url={content.browserUrl}
          theme={browserTheme}
          width={BROWSER.width}
          contentHeight={contentHeight}
          cropY={mockups.desktopCropY}
          style={{ position: "absolute", left: BROWSER.left, top: BROWSER.top }}
        />
      )}

      {mockups.showMobile && (
        <PhoneFrame image={mobile} style={{ position: "absolute", ...phonePosition }} />
      )}
    </div>
  )
}

function chipStyle(background: string): CSSProperties {
  return {
    height: 58,
    display: "inline-flex",
    alignItems: "center",
    padding: "0 24px",
    borderRadius: 12,
    background,
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    maxWidth: COLUMN.width,
    overflow: "hidden",
    textOverflow: "ellipsis",
  }
}

function hexAlpha(hex: string, alpha: number) {
  const value = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${value}`
}
