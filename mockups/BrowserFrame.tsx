import { ImageIcon, Lock } from "lucide-react"
import type { CSSProperties } from "react"

import { useTranslations } from "@/i18n/provider"
import type { ImageAsset } from "@/types/cover"

const THEMES = {
  light: {
    bar: "#ebebed",
    url: "#ffffff",
    urlText: "#3a3a3f",
    border: "rgba(0, 0, 0, 0.08)",
    placeholder: "#f4f4f6",
    placeholderText: "#a0a0a8",
  },
  dark: {
    bar: "#2a2a30",
    url: "#1c1c21",
    urlText: "#d6d6dc",
    border: "rgba(255, 255, 255, 0.06)",
    placeholder: "#1f1f24",
    placeholderText: "#6c6c76",
  },
} as const

export const BROWSER_BAR_HEIGHT = 60

type BrowserFrameProps = {
  image?: ImageAsset
  url: string
  theme: "light" | "dark"
  width: number
  contentHeight: number
  cropY?: number
  /** Icône de l'app, affichée en favicon dans la barre d'adresse. */
  favicon?: ImageAsset
  style?: CSSProperties
}

export function BrowserFrame({
  image,
  url,
  theme,
  width,
  contentHeight,
  cropY = 0,
  favicon,
  style,
}: BrowserFrameProps) {
  const tMockups = useTranslations("mockups")
  const t = THEMES[theme]
  // Une capture plus large que le cadre ne doit pas être rognée sur les côtés :
  // on réduit la hauteur du cadre à celle de l'image mise à la largeur du cadre.
  const fitHeight = image
    ? Math.min(contentHeight, Math.round((width * image.height) / image.width))
    : contentHeight

  return (
    <div
      style={{
        width,
        borderRadius: 16,
        overflow: "hidden",
        background: t.placeholder,
        boxShadow:
          "0 50px 120px rgba(0, 0, 0, 0.45), 0 12px 32px rgba(0, 0, 0, 0.25)",
        ...style,
      }}
    >
      <div
        style={{
          height: BROWSER_BAR_HEIGHT,
          background: t.bar,
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          gap: 12,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
          <span
            key={color}
            style={{
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: color,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 46,
            width: 630,
            height: 36,
            borderRadius: 8,
            background: t.url,
            color: t.urlText,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            fontSize: 20,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <Lock size={18} strokeWidth={2.5} color="#d4a017" />
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon.dataUrl}
              alt=""
              style={{ width: 22, height: 22, borderRadius: 5, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {url}
          </span>
        </div>
      </div>
      <div style={{ height: fitHeight, position: "relative" }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.dataUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `50% ${cropY * 100}%`,
              display: "block",
            }}
          />
        ) : (
          <Placeholder
            color={t.placeholderText}
            label={tMockups("desktopPlaceholder")}
            iconSize={72}
          />
        )}
      </div>
    </div>
  )
}

export function Placeholder({
  color,
  label,
  iconSize,
}: {
  color: string
  label: string
  iconSize: number
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color,
        fontSize: iconSize / 3,
        fontWeight: 500,
      }}
    >
      <ImageIcon size={iconSize} strokeWidth={1.5} />
      {label}
    </div>
  )
}
