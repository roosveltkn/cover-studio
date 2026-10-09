import type { Translator } from "@/i18n/translator"
import type { ImageAsset } from "@/types/cover"

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
/** Les icônes acceptent aussi le SVG, courant pour les logos. */
export const ICON_TYPES = [...ACCEPTED_TYPES, "image/svg+xml"]
export const MAX_SIZE = 10 * 1024 * 1024
/** Plus grand côté retenu pour un SVG, vectoriel donc sans taille propre. */
const SVG_FALLBACK_SIZE = 512

/** Les codes sont aussi des clés du namespace `errors` : le texte vit dans les messages. */
export type ImageErrorCode = "unsupportedFormat" | "imageTooLarge" | "readFailed" | "corrupt"

export class ImageError extends Error {
  constructor(
    readonly code: ImageErrorCode,
    /** Formats acceptés, pour le message `unsupportedFormat`. */
    readonly formats?: string
  ) {
    super(code)
  }
}

/** Message d'erreur d'import dans la langue de l'interface. */
export function describeImageError(error: unknown, t: Translator<"errors">) {
  if (!(error instanceof ImageError)) return t("importFailed")
  return error.code === "unsupportedFormat"
    ? t("unsupportedFormat", { formats: error.formats ?? "" })
    : t(error.code)
}

const FORMAT_NAMES: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/svg+xml": "SVG",
}

export function formatList(types: string[]) {
  return types.map((type) => FORMAT_NAMES[type] ?? type).join(", ")
}

/** Lit un fichier image localement (aucune requête réseau). */
export async function readImage(file: File, types = ACCEPTED_TYPES): Promise<ImageAsset> {
  if (!types.includes(file.type)) {
    throw new ImageError("unsupportedFormat", formatList(types))
  }
  if (file.size > MAX_SIZE) {
    throw new ImageError("imageTooLarge")
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new ImageError("readFailed"))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageError("corrupt"))
    img.src = dataUrl
  })

  return {
    id: crypto.randomUUID(),
    dataUrl,
    ...dimensions(image, file.type === "image/svg+xml"),
    name: file.name,
    ...sampleColors(image),
    dominant: dominantColor(image),
  }
}

/**
 * Un SVG est vectoriel : sa taille intrinsèque (souvent 150 × 150 par défaut
 * dans les navigateurs) n'a pas de sens. On garde ses proportions sur 512 px.
 */
function dimensions(image: HTMLImageElement, vector: boolean) {
  const width = image.naturalWidth || SVG_FALLBACK_SIZE
  const height = image.naturalHeight || SVG_FALLBACK_SIZE
  if (!vector) return { width, height }
  const scale = SVG_FALLBACK_SIZE / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Échantillonne la luminance moyenne et la couleur de la bande haute. */
function sampleColors(image: HTMLImageElement) {
  const size = 32
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return { luminance: 1, topColor: "#ffffff" }

  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  let total = 0
  const top = [0, 0, 0]
  for (let i = 0; i < data.length; i += 4) {
    total += relativeLuminance(data[i], data[i + 1], data[i + 2])
    if (i < size * 4) {
      top[0] += data[i]
      top[1] += data[i + 1]
      top[2] += data[i + 2]
    }
  }

  const topColor =
    "#" +
    top.map((sum) => Math.round(sum / size).toString(16).padStart(2, "0")).join("")

  return { luminance: total / (size * size), topColor }
}

/**
 * Couleur vive la plus présente : les pixels saturés sont regroupés par teinte,
 * puis on moyenne le groupe le plus lourd. Rien si la capture est trop neutre.
 */
function dominantColor(image: HTMLImageElement) {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return undefined

  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = Array.from({ length: 24 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }))
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    const lightness = (max + min) / 2
    const delta = max - min
    if (delta < 0.15 || lightness < 0.15 || lightness > 0.85) continue
    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (saturation < 0.35) continue

    const bucket = buckets[Math.floor(hue(r, g, b) / 15) % 24]
    bucket.weight += saturation
    bucket.r += r * saturation
    bucket.g += g * saturation
    bucket.b += b * saturation
  }

  const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a))
  if (best.weight < size * size * 0.01) return undefined
  return (
    "#" +
    [best.r, best.g, best.b]
      .map((sum) => Math.round(sum / best.weight).toString(16).padStart(2, "0"))
      .join("")
  )
}

function hue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  if (delta === 0) return 0
  const h =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
  return (h * 60 + 360) % 360
}

function relativeLuminance(r: number, g: number, b: number) {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}
