import { notFound } from "next/navigation"

import { Landing } from "@/components/landing/landing"
import { hasLocale } from "@/i18n/routing"
import { landingStructuredData, serializeJsonLd } from "@/lib/structured-data"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingStructuredData(locale)) }}
      />
      <Landing />
    </>
  )
}
