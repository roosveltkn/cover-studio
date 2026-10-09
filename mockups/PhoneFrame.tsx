import type { CSSProperties } from "react"

import { Placeholder } from "@/mockups/BrowserFrame"
import type { ImageAsset } from "@/types/cover"

export const PHONE_SIZE = { width: 402, height: 920 }

const RING = 5
const BEZEL = 13
const STATUS_AREA = 64

type PhoneFrameProps = {
  image?: ImageAsset
  style?: CSSProperties
}

export function PhoneFrame({ image, style }: PhoneFrameProps) {
  const statusColor = image?.topColor ?? "#ffffff"

  return (
    <div
      style={{
        ...PHONE_SIZE,
        borderRadius: 72,
        padding: RING,
        background: "linear-gradient(145deg, #3a3a3e, #1a1a1c 45%, #2c2c30)",
        boxShadow:
          "0 50px 100px rgba(0, 0, 0, 0.5), 0 14px 30px rgba(0, 0, 0, 0.3)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 72 - RING,
          padding: BEZEL,
          background: "#050505",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 72 - RING - BEZEL,
            overflow: "hidden",
            background: image ? statusColor : "#f4f4f6",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: STATUS_AREA,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.dataUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  display: "block",
                }}
              />
            ) : (
              <Placeholder color="#a0a0a8" label="Capture mobile" iconSize={48} />
            )}
          </div>
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              width: 134,
              height: 38,
              marginLeft: -67,
              borderRadius: 19,
              background: "#050505",
            }}
          />
        </div>
      </div>
    </div>
  )
}
