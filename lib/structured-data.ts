import { FAQ_ITEMS } from "@/components/landing/faq-items"
import { MESSAGES } from "@/i18n/messages"
import { locales, type Locale } from "@/i18n/routing"
import { createTranslator } from "@/i18n/translator"

import { GITHUB_URL, SITE_URL } from "./site"

const MIT_URL = "https://opensource.org/licenses/MIT"

/** Données structurées (schema.org) de la landing, dans la langue de la page. */
export function landingStructuredData(locale: Locale) {
  const messages = MESSAGES[locale]
  const meta = createTranslator(messages, "meta")
  const faq = createTranslator(messages, "faq")
  const url = `${SITE_URL}/${locale}`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Cover Studio",
        url,
        inLanguage: locale,
      },
      {
        "@type": "SoftwareApplication",
        name: "Cover Studio",
        url,
        description: meta("siteDescription"),
        applicationCategory: "DesignApplication",
        operatingSystem: "Any (web browser)",
        inLanguage: [...locales],
        isAccessibleForFree: true,
        license: MIT_URL,
        featureList: meta("appFeatures"),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        sameAs: [GITHUB_URL],
      },
      {
        "@type": "SoftwareSourceCode",
        name: "Cover Studio",
        codeRepository: GITHUB_URL,
        programmingLanguage: "TypeScript",
        license: MIT_URL,
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
          "@type": "Question",
          name: faq(question),
          acceptedAnswer: { "@type": "Answer", text: faq(answer) },
        })),
      },
    ],
  }
}

/** Sérialise pour une balise <script> : `<` échappé pour que le JSON ne ferme jamais la balise. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
