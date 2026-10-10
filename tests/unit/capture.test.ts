import { describe, expect, it, vi } from "vitest"

import {
  CaptureError,
  captureFileName,
  captureToFile,
  createCaptureClient,
  describeCaptureError,
  isAbortError,
  normalizeSiteUrl,
} from "@/lib/capture"
import type { CaptureErrorCode, DiscoverResponse } from "@/types/capture"

const ENDPOINT = "https://capture.test"

function codeOf(run: () => unknown) {
  try {
    run()
  } catch (error) {
    return (error as CaptureError).code
  }
  return "ok"
}

async function asyncCodeOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    if (isAbortError(error)) return "abort"
    return (error as CaptureError).code
  }
  return "ok"
}

const webp = (url = "https://monsite.com/") =>
  new Response(new Blob(["RIFF"], { type: "image/webp" }), {
    headers: { "Content-Type": "image/webp", "X-Capture-Url": url },
  })

const json = (body: unknown, status = 200) => Response.json(body, { status })

/** Réponse contrôlée à la main, pour tester l'ordre et les annulations. */
function deferred() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((done) => (resolve = done))
  return { promise, resolve }
}

/** Faux fetch qui suit les appels en cours et respecte l'annulation. */
function fakeFetch(respond: (url: URL) => Promise<Response> | Response) {
  const calls: URL[] = []
  const signals: AbortSignal[] = []
  let inFlight = 0
  let maxInFlight = 0
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    calls.push(url)
    if (init?.signal) signals.push(init.signal)
    inFlight++
    maxInFlight = Math.max(maxInFlight, inFlight)
    try {
      return await new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason))
        Promise.resolve(respond(url)).then(resolve, reject)
      })
    } finally {
      inFlight--
    }
  })
  return {
    fetch: fetch as unknown as typeof globalThis.fetch,
    calls,
    signals,
    get maxInFlight() {
      return maxInFlight
    },
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("normalizeSiteUrl", () => {
  it.each([
    ["monsite.com", "https://monsite.com/"],
    ["  monsite.com/pricing ", "https://monsite.com/pricing"],
    ["http://monsite.com/a#b", "http://monsite.com/a"],
    ["https://www.monsite.com/?ref=1", "https://www.monsite.com/?ref=1"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeSiteUrl(input)).toBe(expected)
  })

  it.each(["", "   ", "monsite", "localhost:3000", "ftp://monsite.com", "https://", "a b.com"])(
    "refuse « %s »",
    (input) => {
      expect(codeOf(() => normalizeSiteUrl(input))).toBe("invalid-url")
    }
  )
})

describe("captureFileName et captureToFile", () => {
  it("forme un nom lisible sans www", () => {
    expect(captureFileName("https://www.stripe.com/fr/pricing", "desktop")).toBe(
      "stripe.com-fr-pricing-desktop.webp"
    )
    expect(captureFileName("https://monsite.com/", "mobile")).toBe("monsite.com-mobile.webp")
  })

  it("produit un fichier WebP prêt pour readImage", () => {
    const file = captureToFile({
      blob: new Blob(["RIFF"], { type: "image/webp" }),
      url: "https://monsite.com/",
      device: "desktop",
    })
    expect(file.name).toBe("monsite.com-desktop.webp")
    expect(file.type).toBe("image/webp")
  })
})

describe("describeCaptureError", () => {
  const t = ((key: string) => key) as Parameters<typeof describeCaptureError>[1]

  it.each<[CaptureErrorCode, string]>([
    ["invalid-url", "captureInvalidUrl"],
    ["blocked", "captureBlocked"],
    ["rate-limited", "captureRateLimited"],
    ["network", "captureNetwork"],
    ["forbidden-origin", "captureFailed"],
    ["internal", "captureFailed"],
  ])("%s → %s", (code, key) => {
    expect(describeCaptureError(new CaptureError(code), t)).toBe(key)
  })

  it("retombe sur un message générique pour une erreur inconnue", () => {
    expect(describeCaptureError(new Error("boom"), t)).toBe("captureFailed")
  })
})

describe("discoverPages", () => {
  const result: DiscoverResponse = {
    site: "https://monsite.com/",
    pages: [
      {
        url: "https://monsite.com/",
        path: "/",
        label: null,
        group: "home",
        source: "link",
      },
    ],
    total: 1,
    meta: { title: "Mon site" },
  }

  it("interroge /api/discover avec l'adresse encodée", async () => {
    const fake = fakeFetch(() => json(result))
    const client = createCaptureClient({
      endpoint: `${ENDPOINT}/`,
      fetch: fake.fetch,
    })
    expect(await client.discoverPages("https://monsite.com/a b?x=1&y=2")).toEqual(result)
    expect(fake.calls[0].origin + fake.calls[0].pathname).toBe(`${ENDPOINT}/api/discover`)
    expect(fake.calls[0].searchParams.get("url")).toBe("https://monsite.com/a b?x=1&y=2")
    expect(fake.calls[0].searchParams.has("lang")).toBe(false)
  })

  it("transmet la langue de l'interface", async () => {
    const fake = fakeFetch(() => json(result))
    const client = createCaptureClient({ endpoint: ENDPOINT, fetch: fake.fetch })
    await client.discoverPages("https://monsite.com/", { language: "en" })
    expect(fake.calls[0].searchParams.get("lang")).toBe("en")
  })

  it.each<[string, () => Response | Promise<Response>, string]>([
    ["un code du service", () => json({ code: "forbidden-host" }, 403), "forbidden-host"],
    ["le firewall (429)", () => new Response("Too Many Requests", { status: 429 }), "rate-limited"],
    ["une page d'erreur HTML", () => new Response("<html>", { status: 502 }), "internal"],
    ["un code inconnu", () => json({ code: "nouveau" }, 500), "internal"],
    ["une réponse mal formée", () => json({ oups: true }), "internal"],
    ["une panne réseau ou CORS", () => Promise.reject(new TypeError("Failed to fetch")), "network"],
  ])("traduit %s", async (_, respond, code) => {
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fakeFetch(respond).fetch,
    })
    expect(await asyncCodeOf(client.discoverPages("https://monsite.com/"))).toBe(code)
  })

  it("laisse passer l'annulation telle quelle", async () => {
    const pending = deferred()
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fakeFetch(() => pending.promise).fetch,
    })
    const controller = new AbortController()
    const discovery = client.discoverPages("https://monsite.com/", { signal: controller.signal })
    controller.abort()
    expect(await asyncCodeOf(discovery)).toBe("abort")
  })
})

describe("capturePage", () => {
  const page = "https://monsite.com/pricing"

  it("renvoie l'image et l'adresse finale", async () => {
    const fake = fakeFetch(() => webp("https://www.monsite.com/pricing"))
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    const result = await client.capturePage(page, "mobile")
    expect(result.url).toBe("https://www.monsite.com/pricing")
    expect(result.device).toBe("mobile")
    expect(result.blob.type).toBe("image/webp")
    expect(fake.calls[0].searchParams.get("device")).toBe("mobile")
  })

  it("garde la capture en mémoire : l'aperçu puis la capture finale = un seul rendu", async () => {
    const fake = fakeFetch(() => webp())
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    expect(client.cached(page, "desktop")).toBeUndefined()
    const preview = await client.capturePage(page, "desktop")
    expect(client.cached(page, "desktop")).toBe(preview)
    expect(await client.capturePage(page, "desktop")).toBe(preview)
    expect(fake.calls).toHaveLength(1)
  })

  it("transmet la langue de l'interface et la distingue dans le cache", async () => {
    const fake = fakeFetch(() => webp())
    const client = createCaptureClient({ endpoint: ENDPOINT, fetch: fake.fetch })
    await client.capturePage(page, "desktop", { language: "en" })
    await client.capturePage(page, "desktop", { language: "fr" })
    await client.capturePage(page, "desktop", { language: "en" })
    expect(fake.calls.map((call) => call.searchParams.get("lang"))).toEqual(["en", "fr"])
    expect(client.cached(page, "desktop", "fr")).toBeDefined()
    expect(client.cached(page, "desktop")).toBeUndefined()
  })

  it("distingue desktop et mobile", async () => {
    const fake = fakeFetch(() => webp())
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    await client.capturePage(page, "desktop")
    await client.capturePage(page, "mobile")
    expect(fake.calls).toHaveLength(2)
  })

  it("partage une requête en cours pour la même page", async () => {
    const pending = deferred()
    const fake = fakeFetch(() => pending.promise)
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    const first = client.capturePage(page, "desktop")
    const second = client.capturePage(page, "desktop")
    pending.resolve(webp())
    expect(await second).toBe(await first)
    expect(fake.calls).toHaveLength(1)
  })

  it("ne garde pas un échec : on peut réessayer", async () => {
    let attempt = 0
    const fake = fakeFetch(() => (++attempt === 1 ? json({ code: "timeout" }, 504) : webp()))
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    expect(await asyncCodeOf(client.capturePage(page, "desktop"))).toBe("timeout")
    expect(await asyncCodeOf(client.capturePage(page, "desktop"))).toBe("ok")
    expect(fake.calls).toHaveLength(2)
  })

  it("refuse une réponse qui n'est pas une image", async () => {
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fakeFetch(() => json({ pas: "une image" })).fetch,
    })
    expect(await asyncCodeOf(client.capturePage(page, "desktop"))).toBe("internal")
  })

  it("limite le nombre de captures simultanées", async () => {
    const replies = new Map<string, ReturnType<typeof deferred>>()
    const fake = fakeFetch((url) => {
      const reply = deferred()
      replies.set(url.searchParams.get("url")!, reply)
      return reply.promise
    })
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
      concurrency: 2,
    })
    const pages = ["/a", "/b", "/c", "/d"].map((path) => `https://monsite.com${path}`)
    const captures = pages.map((url) => client.capturePage(url, "desktop"))

    await tick()
    expect(fake.calls).toHaveLength(2)
    // Chaque capture terminée libère sa place pour la suivante de la file.
    for (const [index, url] of pages.entries()) {
      replies.get(url)!.resolve(webp())
      await tick()
      expect(fake.calls).toHaveLength(Math.min(pages.length, index + 3))
    }
    await Promise.all(captures)
    expect(fake.maxInFlight).toBe(2)
  })

  it("annule la requête quand le seul appelant abandonne", async () => {
    const fake = fakeFetch(() => deferred().promise)
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    const controller = new AbortController()
    const capture = client.capturePage(page, "desktop", { signal: controller.signal })
    await tick()
    controller.abort()
    expect(await asyncCodeOf(capture)).toBe("abort")
    expect(fake.signals[0].aborted).toBe(true)
  })

  it("garde la requête tant qu'un autre appelant attend", async () => {
    const pending = deferred()
    const fake = fakeFetch(() => pending.promise)
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    const preview = new AbortController()
    const abandoned = client.capturePage(page, "desktop", { signal: preview.signal })
    const kept = client.capturePage(page, "desktop", { signal: new AbortController().signal })
    await tick()
    preview.abort()
    expect(await asyncCodeOf(abandoned)).toBe("abort")
    expect(fake.signals[0].aborted).toBe(false)
    pending.resolve(webp())
    expect(await asyncCodeOf(kept)).toBe("ok")
  })

  it("relance une requête neuve après l'abandon de la précédente", async () => {
    let attempt = 0
    const fake = fakeFetch(() => (++attempt === 1 ? deferred().promise : webp()))
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    const controller = new AbortController()
    const abandoned = client.capturePage(page, "desktop", { signal: controller.signal })
    await tick()
    controller.abort()
    const retry = client.capturePage(page, "desktop")
    expect(await asyncCodeOf(abandoned)).toBe("abort")
    expect(await asyncCodeOf(retry)).toBe("ok")
    expect(fake.calls).toHaveLength(2)
  })

  it("retire de la file une capture annulée avant son tour", async () => {
    const pending = deferred()
    const fake = fakeFetch(() => pending.promise)
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
      concurrency: 1,
    })
    const running = client.capturePage("https://monsite.com/a", "desktop")
    const controller = new AbortController()
    const queued = client.capturePage("https://monsite.com/b", "desktop", {
      signal: controller.signal,
    })
    await tick()
    controller.abort()
    expect(await asyncCodeOf(queued)).toBe("abort")
    pending.resolve(webp())
    await running
    await tick()
    expect(fake.calls).toHaveLength(1)
  })

  it("refuse immédiatement un signal déjà annulé", async () => {
    const fake = fakeFetch(() => webp())
    const client = createCaptureClient({
      endpoint: ENDPOINT,
      fetch: fake.fetch,
    })
    expect(() => client.capturePage(page, "desktop", { signal: AbortSignal.abort() })).toThrow()
    expect(fake.calls).toHaveLength(0)
  })
})
