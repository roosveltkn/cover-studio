import type { CSSProperties } from "react"

import { useTranslations } from "@/i18n/provider"
import { Placeholder } from "@/mockups/BrowserFrame"
import { CoverImage } from "@/mockups/CoverImage"
import type { ImageAsset } from "@/types/cover"

export const PHONE_SIZE = { width: 402, height: 920 }

const RADIUS = 72
const RING = 5
const BEZEL = 13
const STATUS_AREA = 64
/** Hauteur / largeur de la zone de capture (402 × 920 moins anneau, cadre et barre d'état). */
const SCREEN_RATIO =
  (PHONE_SIZE.height - 2 * (RING + BEZEL) - STATUS_AREA) / (PHONE_SIZE.width - 2 * (RING + BEZEL))

type PhoneFrameProps = {
  image?: ImageAsset
  /** Facteur appliqué à toutes les cotes (402 × 920 à l'échelle 1). */
  scale?: number
  /** Ancrage vertical de la capture, pour varier le cadrage d'une même image. */
  imagePosition?: string
  style?: CSSProperties
}

export function PhoneFrame({ image, scale = 1, imagePosition = "top", style }: PhoneFrameProps) {
  const t = useTranslations("mockups")
  const statusColor = image?.topColor ?? "#ffffff"
  const s = (value: number) => value * scale
  const shortImage = image ? image.height / image.width < SCREEN_RATIO : false

  return (
    <div
      style={{
        width: s(PHONE_SIZE.width),
        height: s(PHONE_SIZE.height),
        borderRadius: s(RADIUS),
        padding: s(RING),
        background: "linear-gradient(145deg, #3a3a3e, #1a1a1c 45%, #2c2c30)",
        boxShadow: "0 50px 100px rgba(0, 0, 0, 0.5), 0 14px 30px rgba(0, 0, 0, 0.3)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: s(RADIUS - RING),
          padding: s(BEZEL),
          background: "#050505",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: s(RADIUS - RING - BEZEL),
            overflow: "hidden",
            background: image ? statusColor : "#f4f4f6",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: s(STATUS_AREA),
              left: 0,
              right: 0,
              bottom: 0,
              background: shortImage ? (image?.bottomColor ?? statusColor) : undefined,
            }}
          >
            {image ? (
              // Une capture plus courte que l'écran est calée sur la largeur, en haut :
              // `cover` la rognerait sur les côtés. Le bas est comblé de sa couleur.
              <CoverImage
                src={image.dataUrl}
                position={shortImage ? "50% 0%" : `50% ${imagePosition}`}
                size={shortImage ? "100% auto" : "cover"}
              />
            ) : (
              <Placeholder color="#a0a0a8" label={t("mobilePlaceholder")} iconSize={s(48)} />
            )}
          </div>
          <div
            style={{
              position: "absolute",
              top: s(14),
              left: "50%",
              width: s(134),
              height: s(38),
              marginLeft: s(-67),
              borderRadius: s(19),
              background: "#050505",
            }}
          />
        </div>
      </div>
    </div>
  )
}
