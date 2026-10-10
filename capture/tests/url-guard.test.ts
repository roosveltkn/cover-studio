import { describe, expect, it } from "vitest"

import { CaptureError } from "../lib/errors.js"
import {
  assertPublicHost,
  createHostChecker,
  isPublicAddress,
  parseTargetUrl,
  type Resolver,
} from "../lib/url-guard.js"

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
    return (error as CaptureError).code
  }
  return "ok"
}

const resolveTo =
  (...addresses: string[]): Resolver =>
  async () =>
    addresses

describe("parseTargetUrl", () => {
  it("ajoute https:// quand le schéma manque", () => {
    expect(parseTargetUrl("monsite.com").href).toBe("https://monsite.com/")
    expect(parseTargetUrl("  monsite.com/pricing  ").href).toBe(
      "https://monsite.com/pricing"
    )
  })

  it("retire le fragment et garde la query string", () => {
    expect(parseTargetUrl("https://monsite.com/a?b=1#c").href).toBe(
      "https://monsite.com/a?b=1"
    )
  })

  it.each([
    ["", "invalid-url"],
    ["ftp://monsite.com", "invalid-url"],
    ["file:///etc/passwd", "invalid-url"],
    ["javascript:alert(1)", "invalid-url"],
    ["https://user:pass@monsite.com", "invalid-url"],
    ["https://monsite.com:8080", "invalid-url"],
    ["https://", "invalid-url"],
    [`https://monsite.com/${"a".repeat(2100)}`, "invalid-url"],
  ])("refuse %s", (input, code) => {
    expect(codeOf(() => parseTargetUrl(input))).toBe(code)
  })

  it.each([
    "http://localhost",
    "http://localhost.",
    "http://app.localhost",
    "http://printer.local",
    "http://db.internal",
    "http://intranet",
    "http://127.0.0.1",
    "http://127.1",
    "http://0x7f000001",
    "http://2130706433",
    "http://0.0.0.0",
    "http://10.0.0.1",
    "http://172.16.5.4",
    "http://192.168.1.1",
    "http://169.254.169.254",
    "http://100.64.0.1",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
    "http://[::ffff:7f00:1]",
    "http://[fd00::1]",
    "http://[fe80::1]",
    "http://[64:ff9b::7f00:1]",
    "http://[2002:7f00:1::]",
  ])("refuse l'hôte local ou privé %s", (input) => {
    expect(codeOf(() => parseTargetUrl(input))).toBe("forbidden-host")
  })

  it("accepte une IP publique littérale", () => {
    expect(parseTargetUrl("http://93.184.216.34").hostname).toBe(
      "93.184.216.34"
    )
    expect(parseTargetUrl("http://[2606:4700::1111]").hostname).toBe(
      "[2606:4700::1111]"
    )
  })
})

describe("isPublicAddress", () => {
  it.each(["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"])(
    "accepte %s",
    (address) => expect(isPublicAddress(address)).toBe(true)
  )

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.31.255.255",
    "192.168.0.1",
    "169.254.169.254",
    "100.100.100.200",
    "0.0.0.0",
    "255.255.255.255",
    "224.0.0.1",
    "::",
    "::1",
    "::ffff:10.0.0.1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "pas-une-ip",
  ])("refuse %s", (address) => expect(isPublicAddress(address)).toBe(false))
})

describe("assertPublicHost", () => {
  it("accepte un nom qui ne résout que vers des IP publiques", async () => {
    const url = new URL("https://monsite.com")
    expect(
      await asyncCodeOf(assertPublicHost(url, resolveTo("93.184.216.34")))
    ).toBe("ok")
  })

  it("refuse un nom dont une seule adresse est privée", async () => {
    const url = new URL("https://piege.example.com")
    expect(
      await asyncCodeOf(
        assertPublicHost(url, resolveTo("93.184.216.34", "10.0.0.1"))
      )
    ).toBe("forbidden-host")
  })

  it("signale un nom introuvable comme injoignable", async () => {
    const url = new URL("https://inconnu.example.com")
    const failing: Resolver = async () => {
      throw new Error("ENOTFOUND")
    }
    expect(await asyncCodeOf(assertPublicHost(url, failing))).toBe(
      "unreachable"
    )
    expect(await asyncCodeOf(assertPublicHost(url, resolveTo()))).toBe(
      "unreachable"
    )
  })

  it("ne résout pas les IP littérales", async () => {
    const url = new URL("http://93.184.216.34")
    const never: Resolver = async () => {
      throw new Error("ne doit pas être appelé")
    }
    expect(await asyncCodeOf(assertPublicHost(url, never))).toBe("ok")
  })
})

describe("createHostChecker", () => {
  it("met le verdict en cache par hôte", async () => {
    let calls = 0
    const check = createHostChecker(async () => {
      calls++
      return ["93.184.216.34"]
    })
    expect(await check(new URL("https://cdn.example.com/a.js"))).toBe(true)
    expect(await check(new URL("https://cdn.example.com/b.css"))).toBe(true)
    expect(calls).toBe(1)
  })

  it("refuse sans lever d'erreur", async () => {
    const check = createHostChecker(resolveTo("192.168.1.10"))
    expect(await check(new URL("https://routeur.example.com"))).toBe(false)
    expect(await check(new URL("http://localhost:9001"))).toBe(false)
  })
})
