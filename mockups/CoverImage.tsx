import type { CSSProperties } from "react"

type CoverImageProps = {
  src: string
  /** Valeur CSS de `background-position`, ex. `50% 20%`. */
  position?: string
  style?: CSSProperties
}

/**
 * Capture affichée en `cover`. Un `background-image` plutôt qu'un `<img>` avec
 * `object-fit` : Safari/iOS ignore `object-fit` dans le `foreignObject` SVG
 * utilisé par html-to-image, ce qui déformait les captures à l'export.
 */
export function CoverImage({ src, position = "50% 0%", style }: CoverImageProps) {
  return (
    <div
      role="presentation"
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url("${src}")`,
        backgroundSize: "cover",
        backgroundPosition: position,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  )
}
