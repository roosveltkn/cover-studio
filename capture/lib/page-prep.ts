import type { Browser, HTTPRequest, Page } from "puppeteer-core"

import { desktopUserAgent } from "./browser.js"
import { DEVICES, type Device } from "./devices.js"
import { createHostChecker } from "./url-guard.js"

/** Domaines des gestionnaires de consentement courants : leurs scripts sont bloqués. */
const CONSENT_HOSTS = [
  "cookielaw.org",
  "onetrust.com",
  "cookiepro.com",
  "cookiebot.com",
  "privacy-center.org",
  "axept.io",
  "usercentrics.eu",
  "trustarc.com",
  "quantcast.com",
  "consensu.org",
  "iubenda.com",
  "osano.com",
  "privacy-mgmt.com",
  "consentframework.com",
  "termly.io",
  "cookieyes.com",
  "cookie-script.com",
  "cookiefirst.com",
  "complianz.io",
]

/** Scripts de consentement auto-hébergés, reconnus à leur chemin. */
const CONSENT_PATHS =
  /tarteaucitron|cookieconsent|cookie-law-info|complianz|klaro/i

/** Conteneurs connus des bannières, masqués même si leur script passe. */
const CONSENT_SELECTORS = [
  "#onetrust-consent-sdk",
  "#CybotCookiebotDialog",
  "#CybotCookiebotDialogBodyUnderlay",
  "#didomi-host",
  ".didomi-popup-open",
  "#axeptio_overlay",
  ".axeptio_mount",
  "#usercentrics-root",
  "#tarteaucitronRoot",
  "#cmplz-cookiebanner-container",
  ".cmplz-cookiebanner",
  "#cookie-law-info-bar",
  ".cky-consent-container",
  ".cky-overlay",
  "#moove_gdpr_cookie_info_bar",
  ".cc-window",
  ".cc-banner",
  "#cc-main",
  "#cookie-notice",
  "#cookiescript_injected",
  ".qc-cmp2-container",
  "[id^='sp_message_container']",
  "#truste-consent-track",
  ".osano-cm-window",
  "#iubenda-cs-banner",
  "#hs-eu-cookie-confirmation",
  ".fc-consent-root",
  "#termly-code-snippet-support",
  ".klaro",
]

const HIDE_CSS = `${CONSENT_SELECTORS.join(",")}{display:none!important}`

export type PageState = {
  /** La navigation principale a visé une adresse interdite. */
  forbiddenNavigation: boolean
}

function isConsentRequest(url: URL) {
  const host = url.hostname
  return (
    CONSENT_HOSTS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    ) || CONSENT_PATHS.test(url.pathname)
  )
}

/**
 * Configure la page avant navigation : appareil, préférences d'affichage,
 * filtre réseau (anti-SSRF et scripts de consentement) et CSS de masquage.
 */
export async function preparePage(
  page: Page,
  browser: Browser,
  device: Device
): Promise<PageState> {
  const profile = DEVICES[device]
  const state: PageState = { forbiddenNavigation: false }
  const isPublicHost = createHostChecker()

  await page.setViewport(profile.viewport)
  await page.setUserAgent({
    userAgent: profile.userAgent ?? (await desktopUserAgent(browser)),
  })
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: "light" },
  ])

  await page.setRequestInterception(true)
  page.on("request", (request) => {
    void filterRequest(request).catch(() => {})
  })

  async function filterRequest(request: HTTPRequest) {
    if (request.isInterceptResolutionHandled()) return
    let url: URL
    try {
      url = new URL(request.url())
    } catch {
      return request.abort("blockedbyclient")
    }
    if (["data:", "blob:", "about:"].includes(url.protocol))
      return request.continue()
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return request.abort("blockedbyclient")
    if (isConsentRequest(url)) return request.abort("blockedbyclient")

    if (!(await isPublicHost(url))) {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        state.forbiddenNavigation = true
      return request.abort("blockedbyclient")
    }
    return request.continue()
  }

  await page.evaluateOnNewDocument((css: string) => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = css
      document.head.append(style)
    })
  }, HIDE_CSS)

  return state
}

/**
 * Laisse la page se stabiliser : polices chargées, défilement pour déclencher
 * le lazy-load, retour en haut, puis retrait des bannières restantes.
 */
export async function settlePage(page: Page) {
  await page.evaluate(async () => {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await Promise.race([document.fonts.ready, sleep(3000)])

    const step = window.innerHeight
    const bottom = Math.min(document.documentElement.scrollHeight, step * 8)
    for (let y = step; y < bottom; y += step) {
      window.scrollTo(0, y)
      await sleep(150)
    }
    window.scrollTo(0, 0)
    await sleep(400)
  })

  await page.evaluate(removeConsentOverlays)
}

/**
 * Exécutée dans la page : masque les éléments fixes qui parlent de cookies
 * (bannières non répertoriées), puis le voile vide qu'ils laissent souvent,
 * et rend le défilement bloqué par la modale.
 */
function removeConsentOverlays() {
  const words = /cookie|consent|rgpd|gdpr|confidentialit|privacy|datenschutz/i
  const viewportArea = window.innerWidth * window.innerHeight
  const fixed = Array.from(
    document.querySelectorAll<HTMLElement>("body *")
  ).filter((element) => {
    const position = getComputedStyle(element).position
    return position === "fixed" || position === "sticky"
  })

  let removed = false
  for (const element of fixed) {
    if (element.closest("header, nav")) continue
    if (!words.test(element.textContent ?? "")) continue
    element.style.setProperty("display", "none", "important")
    removed = true
  }
  if (!removed) return

  for (const element of fixed) {
    if ((element.textContent ?? "").trim()) continue
    const rect = element.getBoundingClientRect()
    if (rect.width * rect.height >= viewportArea * 0.9)
      element.style.setProperty("display", "none", "important")
  }
  for (const root of [document.documentElement, document.body]) {
    if (getComputedStyle(root).overflow === "hidden")
      root.style.setProperty("overflow", "auto", "important")
  }
}
