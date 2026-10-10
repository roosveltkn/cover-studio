import type { CSSProperties, ReactNode } from "react"

import { hexAlpha, readableOn, tone } from "@/lib/color"
import { BROWSER_BAR_HEIGHT, BrowserFrame } from "@/mockups/BrowserFrame"
import { PHONE_SIZE, PhoneFrame } from "@/mockups/PhoneFrame"
import {
  COVER_SIZE,
  browserContentHeight,
  resolveBrowserTheme,
} from "@/templates/shared/mockups"
import { Chips, CoverRoot, TextBlock, useTextScale } from "@/templates/shared/text-block"
import { EditableText } from "@/templates/shared/editable"
import type { PlacedConfig } from "@/types/cover"

const PAD = 64
const GAP = 32
const RADIUS = 40
const SIDE = 760
const PHONE_COLUMN = 408
const INTRO_HEIGHT = 860

/** Grille de tuiles arrondies : présentation, fonctionnalités, desktop, mobile. */
export function BentoTemplate({ config }: { config: PlacedConfig }) {
  const { content, style, mockups } = config
  const footerScale = useTextScale("footer")
  const brand = style.brandColor
  // La tuile de présentation porte du texte blanc : on garantit le contraste AA.
  const brandTile = readableOn(brand, "#ffffff")
  const ink = tone(brand, 0.22, 0.5)
  const showDesktop = mockups.showDesktop
  const showMobile = mockups.showMobile

  const innerHeight = COVER_SIZE.height - PAD * 2
  const mainLeft = PAD + SIDE + GAP
  const mainWidth = COVER_SIZE.width - mainLeft - PAD
  const desktopWidth = showMobile ? mainWidth - GAP - PHONE_COLUMN : mainWidth
  const phoneColumnLeft = showDesktop ? mainLeft + desktopWidth + GAP : mainLeft
  const phoneColumnWidth = showDesktop ? PHONE_COLUMN : mainWidth
  const phoneScale = showDesktop ? 0.9 : 1.2
  // Le navigateur déborde à droite de sa tuile pour garder une capture lisible.
  const browserWidth = Math.round(desktopWidth * (showMobile ? 1.25 : 0.88))
  const browserHeight = browserContentHeight(mockups.desktopImage, browserWidth, {
    min: 640,
    max: innerHeight - 180,
    empty: 760,
  })

  return (
    <CoverRoot size={COVER_SIZE} style={{ background: tone(brand, 0.955, 0.15) }}>
      <Tile
        style={{ left: PAD, top: PAD, width: SIDE, height: INTRO_HEIGHT, background: brandTile }}
      >
        <TextBlock
          content={content}
          width={SIDE - 120}
          nameSize={92}
          hideChips
          colors={{
            text: "#ffffff",
            muted: "rgba(255, 255, 255, 0.88)",
            accent: style.accentColor ?? tone(brand, 0.86, 0.6),
            badgeBorder: "rgba(255, 255, 255, 0.4)",
            badgeBg: "rgba(255, 255, 255, 0.12)",
            chipBg: "transparent",
          }}
          style={{ position: "absolute", left: 60, top: 64 }}
        />
      </Tile>

      <Tile
        style={{
          left: PAD,
          top: PAD + INTRO_HEIGHT + GAP,
          width: SIDE,
          height: innerHeight - INTRO_HEIGHT - GAP,
          background: "#ffffff",
          padding: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Chips
          chips={content.chips}
          radius={999}
          maxWidth={SIDE - 120}
          colors={{ text: ink, chipBg: tone(brand, 0.95, 0.35), chipText: ink }}
        />
        {content.footer && (
          <div style={{ fontSize: 26 * footerScale, fontWeight: 500, color: tone(brand, 0.4, 0.4) }}>
            <EditableText field="footer" text={content.footer} />
          </div>
        )}
      </Tile>

      {showDesktop && (
        <Tile
          style={{
            left: mainLeft,
            top: PAD,
            width: desktopWidth,
            height: innerHeight,
            background: `linear-gradient(160deg, ${tone(brand, 0.9, 0.5)} 0%, ${tone(brand, 0.78, 0.8)} 100%)`,
          }}
        >
          <BrowserFrame
            image={mockups.desktopImage}
            url={content.browserUrl}
            favicon={content.icon}
            theme={resolveBrowserTheme(mockups)}
            width={browserWidth}
            contentHeight={browserHeight}
            cropY={mockups.desktopCropY}
            style={{
              position: "absolute",
              left: 90,
              top: Math.max(90, (innerHeight - browserHeight - BROWSER_BAR_HEIGHT) / 2),
            }}
          />
        </Tile>
      )}

      {showMobile && (
        <Tile
          style={{
            left: phoneColumnLeft,
            top: PAD,
            width: phoneColumnWidth,
            height: innerHeight,
            background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${hexAlpha(tone(brand, 0.45, 1), 0.9)} 0%, ${tone(brand, 0.2, 0.6)} 100%)`,
          }}
        >
          <PhoneFrame
            image={mockups.mobileImage}
            scale={phoneScale}
            style={{
              position: "absolute",
              left: (phoneColumnWidth - PHONE_SIZE.width * phoneScale) / 2,
              top: showDesktop ? (innerHeight - PHONE_SIZE.height * phoneScale) / 2 : 110,
            }}
          />
        </Tile>
      )}
    </CoverRoot>
  )
}

function Tile({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: RADIUS,
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
