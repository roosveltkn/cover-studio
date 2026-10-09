import type { Metadata } from "next"

import { Editor } from "@/components/editor/editor"
import { MESSAGES } from "@/i18n/messages"
import { hasLocale, locales } from "@/i18n/routing"
import { createTranslator } from "@/i18n/translator"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const t = createTranslator(MESSAGES[locale], "meta")

  return {
    title: t("editorTitle"),
    // L'éditeur n'a rien à indexer : sans capture importée, il renvoie vers l'accueil.
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${locale}/editor`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/editor`])),
    },
  }
}

export default function EditorPage() {
  return <Editor />
}
