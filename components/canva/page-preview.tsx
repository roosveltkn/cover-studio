"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { useLocale, useTranslations } from "@/i18n/provider"
import { trackUrlPreviewed } from "@/lib/analytics"
import { describeCaptureError, isAbortError, type CaptureClient } from "@/lib/capture"

type PreviewState =
  { status: "loading" } | { status: "ready"; src: string } | { status: "error"; message: string }

/**
 * Aperçu d'une page, chargé à l'ouverture. C'est la vraie capture desktop :
 * le client la garde en mémoire, donc cocher la page ensuite ne relance pas
 * de rendu. Fermer l'aperçu pendant le chargement l'annule, sauf si la
 * capture finale attend la même image.
 */
export function PagePreview({
  client,
  url,
  label,
}: {
  client: CaptureClient
  url: string
  label: string
}) {
  const t = useTranslations("urlImport")
  const tErrors = useTranslations("errors")
  const locale = useLocale()
  const [state, setState] = useState<PreviewState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    let src: string | undefined
    if (!client.cached(url, "desktop", locale)) trackUrlPreviewed()

    client.capturePage(url, "desktop", { signal: controller.signal, language: locale }).then(
      (result) => {
        src = URL.createObjectURL(result.blob)
        setState({ status: "ready", src })
      },
      (error) => {
        if (isAbortError(error)) return
        setState({
          status: "error",
          message: describeCaptureError(error, tErrors),
        })
      }
    )
    return () => {
      controller.abort()
      if (src) URL.revokeObjectURL(src)
    }
  }, [client, url, locale, tErrors])

  if (state.status === "error")
    return (
      <p role="alert" className="px-3 pb-3 text-xs text-destructive">
        {state.message}
      </p>
    )

  return (
    <div className="px-3 pb-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
        {state.status === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.src}
            alt={t("previewAlt", { page: label })}
            className="size-full object-cover object-top"
          />
        ) : (
          <span
            role="status"
            className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            {t("previewLoading")}
          </span>
        )}
      </div>
    </div>
  )
}
