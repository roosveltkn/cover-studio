import { createContext, useContext, type CSSProperties } from "react"

import type { CoverConfig, ImageAsset } from "@/types/cover"

export type TextColors = {
  text: string
  muted: string
  accent: string
  badgeBorder: string
  badgeBg: string
  badgeText?: string
  chipBg: string
  chipText?: string
  chipBorder?: string
}

type TextBlockProps = {
  content: CoverConfig["content"]
  colors: TextColors
  width: number
  align?: "left" | "center"
  /** Taille du nom pour un nom court ; réduite au-delà de 12 caractères. */
  nameSize?: number
  descriptionLines?: number
  /** Coins des chips : 12 par défaut, 999 pour des pilules, 0 pour du carré. */
  chipRadius?: number
  /** Masque les chips quand le template les affiche ailleurs. */
  hideChips?: boolean
  style?: CSSProperties
}

/** Pastille, nom, description et chips : bloc de texte commun aux templates. */
export function TextBlock({
  content,
  colors,
  width,
  align = "left",
  nameSize = 102,
  descriptionLines = 3,
  chipRadius = 12,
  hideChips = false,
  style,
}: TextBlockProps) {
  const name = `${content.nameMain}${content.nameAccent ?? ""}`
  const fontSize =
    name.length <= 12 ? nameSize : Math.max(nameSize * 0.66, (nameSize * 12) / name.length)
  const centered = align === "center"

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "flex-start",
        textAlign: align,
        color: colors.text,
        ...style,
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
            border: `2px solid ${colors.badgeBorder}`,
            background: colors.badgeBg,
            color: colors.badgeText ?? colors.text,
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

      <div
        style={{
          marginTop: 38,
          maxWidth: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: centered ? "center" : "flex-start",
          gap: Math.round(fontSize * 0.3),
        }}
      >
        {content.icon && <AppIcon image={content.icon} size={Math.round(fontSize * 1.1)} />}
        <h1
          style={{
            margin: 0,
            minWidth: 0,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            overflowWrap: "anywhere",
          }}
        >
          {content.nameMain}
          {content.nameAccent && <span style={{ color: colors.accent }}>{content.nameAccent}</span>}
        </h1>
      </div>

      {content.description && (
        <p
          style={{
            margin: "22px 0 0",
            fontSize: 31,
            lineHeight: 1.45,
            color: colors.muted,
            display: "-webkit-box",
            WebkitLineClamp: descriptionLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {content.description}
        </p>
      )}

      {!hideChips && content.chips.length > 0 && (
        <Chips
          chips={content.chips}
          colors={colors}
          radius={chipRadius}
          maxWidth={width}
          justify={centered ? "center" : "flex-start"}
          style={{ marginTop: 50 }}
        />
      )}
    </div>
  )
}

/** Icône d'app aux coins arrondis façon iOS (≈ 22 % du côté). */
export function AppIcon({
  image,
  size,
  style,
}: {
  image: ImageAsset
  size: number
  style?: CSSProperties
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.dataUrl}
      alt=""
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: "cover",
        borderRadius: size * 0.225,
        display: "block",
        ...style,
      }}
    />
  )
}

export function Chips({
  chips,
  colors,
  radius = 12,
  maxWidth,
  justify = "flex-start",
  style,
}: {
  chips: string[]
  colors: Pick<TextColors, "text" | "chipBg" | "chipText" | "chipBorder">
  radius?: number
  maxWidth: number
  justify?: "flex-start" | "center"
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: justify,
        gap: "16px 15px",
        ...style,
      }}
    >
      {chips.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          style={{
            height: 58,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 24px",
            borderRadius: radius,
            background: colors.chipBg,
            color: colors.chipText ?? colors.text,
            border: colors.chipBorder ? `2px solid ${colors.chipBorder}` : undefined,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            maxWidth,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  )
}

export function Footer({
  text,
  color,
  style,
}: {
  text: string
  color: string
  style: CSSProperties
}) {
  if (!text) return null
  return (
    <div
      style={{
        position: "absolute",
        fontSize: 26,
        fontWeight: 500,
        color,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...style,
      }}
    >
      {text}
    </div>
  )
}

/**
 * Canevas du format d'export choisi. Absent : le canevas vaut la taille
 * native du template.
 */
export const CanvasContext = createContext<{ width: number; height: number } | null>(null)

/**
 * Racine commune : police du template et rognage. Le fond (`style`) couvre
 * tout le canevas du format, le contenu garde sa taille native au centre.
 */
export function CoverRoot({
  size,
  style,
  children,
}: {
  size: { width: number; height: number }
  style: CSSProperties
  children: React.ReactNode
}) {
  const canvas = useContext(CanvasContext) ?? size

  return (
    <div
      style={{
        ...canvas,
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-poppins), sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          ...size,
          position: "absolute",
          left: (canvas.width - size.width) / 2,
          top: (canvas.height - size.height) / 2,
        }}
      >
        {children}
      </div>
    </div>
  )
}
