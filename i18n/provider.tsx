"use client"

import { createContext, useContext, useMemo } from "react"

import { MESSAGES } from "./messages"
import type { Locale } from "./routing"
import { createTranslator, type Messages, type Namespace, type Translator } from "./translator"

type I18nContextValue = { locale: Locale; messages: Messages }

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ locale, messages: MESSAGES[locale] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useLocale/useTranslations doivent être sous <I18nProvider>.")
  return context
}

export function useLocale(): Locale {
  return useI18n().locale
}

export function useTranslations<N extends Namespace>(namespace: N): Translator<N> {
  const { messages } = useI18n()
  return useMemo(() => createTranslator(messages, namespace), [messages, namespace])
}
