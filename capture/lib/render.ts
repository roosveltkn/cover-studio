import { TimeoutError, type Page } from "puppeteer-core"

import { withPage } from "./browser.js"
import type { Device } from "./devices.js"
import { CaptureError } from "./errors.js"
import { preparePage, settlePage, type PageState } from "./page-prep.js"

const NAVIGATION_TIMEOUT_MS = 20_000
/** Statuts qui signalent un refus du robot plutôt qu'une page cassée. */
const BLOCKED_STATUSES = new Set([401, 403, 429, 503])
/** Titres des pages de challenge anti-robot (Cloudflare, Akamai…). */
const CHALLENGE_TITLES = /just a moment|attention required|access denied/i

/**
 * Charge l'adresse et vérifie le résultat. Une page lente mais affichée est
 * gardée : mieux vaut une capture qu'une erreur pour un pixel de tracking.
 */
async function navigate(page: Page, url: URL, state: PageState): Promise<URL> {
  let status = 200
  try {
    const response = await page.goto(url.href, {
      waitUntil: "load",
      timeout: NAVIGATION_TIMEOUT_MS,
    })
    status = response?.status() ?? 200
  } catch (error) {
    if (state.forbiddenNavigation) throw new CaptureError("forbidden-host")
    if (!(error instanceof TimeoutError))
      throw new CaptureError("unreachable", { cause: error })
    const readyState = await page
      .evaluate(() => document.readyState)
      .catch(() => "loading")
    if (readyState === "loading")
      throw new CaptureError("timeout", { cause: error })
  }

  // Une redirection vers une adresse interdite a pu être bloquée en route.
  if (state.forbiddenNavigation) throw new CaptureError("forbidden-host")
  if (BLOCKED_STATUSES.has(status)) throw new CaptureError("blocked")
  if (status >= 400) throw new CaptureError("unreachable")

  await page
    .waitForNetworkIdle({ idleTime: 500, timeout: 5_000 })
    .catch(() => {})
  if (CHALLENGE_TITLES.test(await page.title()))
    throw new CaptureError("blocked")
  return new URL(page.url())
}

export type Capture = { image: Uint8Array; url: URL }

export function capturePage(
  url: URL,
  device: Device,
  language: string
): Promise<Capture> {
  return withPage(async (page, browser) => {
    const state = await preparePage(page, browser, device, language)
    const finalUrl = await navigate(page, url, state)
    await settlePage(page)
    const image = await page.screenshot({ type: "webp", quality: 85 })
    return { image, url: finalUrl }
  })
}

/** HTML après exécution du JavaScript, pour lister les liens d'une SPA. */
export function renderHtml(
  url: URL,
  language: string
): Promise<{ url: URL; body: string }> {
  return withPage(async (page, browser) => {
    const state = await preparePage(page, browser, "desktop", language)
    const finalUrl = await navigate(page, url, state)
    return { url: finalUrl, body: await page.content() }
  })
}
