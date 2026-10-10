import chromium from "@sparticuz/chromium"
import puppeteer, { type Browser, type Page } from "puppeteer-core"

let browserPromise: Promise<Browser> | null = null

/**
 * Sur Vercel : Chromium de @sparticuz/chromium (binaire Linux). En local :
 * le Chrome installé, désigné par CHROME_PATH.
 */
async function launch(): Promise<Browser> {
  const localChrome = process.env.CHROME_PATH
  if (localChrome) {
    return puppeteer.launch({ executablePath: localChrome, headless: true })
  }
  // Pas de WebGL : inutile pour une capture, et évite d'extraire SwiftShader.
  chromium.setGraphicsMode = false
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  })
}

/**
 * Navigateur partagé entre les requêtes d'une même instance (Fluid compute) :
 * le démarrage de Chromium coûte plusieurs secondes.
 */
async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null)
    if (browser?.connected) return browser
  }
  browserPromise = launch()
  browserPromise.catch(() => {
    browserPromise = null
  })
  return browserPromise
}

/** User-Agent de Chrome sans la mention « HeadlessChrome », que des sites refusent. */
export async function desktopUserAgent(browser: Browser) {
  return (await browser.userAgent()).replace("HeadlessChrome", "Chrome")
}

/**
 * Ouvre une page dans un contexte isolé (cookies, cache, stockage) et le
 * ferme quoi qu'il arrive.
 */
export async function withPage<T>(
  task: (page: Page, browser: Browser) => Promise<T>
): Promise<T> {
  const browser = await getBrowser()
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    return await task(page, browser)
  } finally {
    await context.close().catch(() => {})
  }
}
