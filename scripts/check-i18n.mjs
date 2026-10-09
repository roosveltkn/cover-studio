// Contrôle des messages : `pnpm i18n:check`.
//   1. mêmes clés dans toutes les langues ;
//   2. mêmes variables `{nom}` dans chaque message ;
//   3. aucune clé inutilisée dans le code ;
//   4. aucun texte accentué en dur dans les composants (hors commentaires).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const LOCALES = ["fr", "en"]
const REFERENCE = "fr"
// Namespaces dont les clés sont composées dynamiquement (`${id}Title`).
const DYNAMIC_NAMESPACES = new Set(["panels"])
const SOURCE_DIRS = ["app", "components", "i18n", "lib", "mockups", "stores", "templates"]
const TEXT_DIRS = ["components", "mockups", "templates"]

const messages = Object.fromEntries(
  LOCALES.map((locale) => [locale, JSON.parse(readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"))])
)

function flatten(tree) {
  const flat = new Map()
  for (const [namespace, entries] of Object.entries(tree)) {
    for (const [key, value] of Object.entries(entries)) flat.set(`${namespace}.${key}`, value)
  }
  return flat
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : walk(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const problems = []
const flat = Object.fromEntries(LOCALES.map((locale) => [locale, flatten(messages[locale])]))
const variables = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")

// 1 et 2 : parité des clés et des variables avec la langue de référence.
for (const locale of LOCALES.filter((l) => l !== REFERENCE)) {
  for (const key of flat[REFERENCE].keys()) {
    if (!flat[locale].has(key)) problems.push(`[${locale}] clé manquante : ${key}`)
    else if (variables(flat[locale].get(key)) !== variables(flat[REFERENCE].get(key)))
      problems.push(`[${locale}] variables différentes de ${REFERENCE} : ${key}`)
  }
  for (const key of flat[locale].keys()) {
    if (!flat[REFERENCE].has(key)) problems.push(`[${locale}] clé absente de ${REFERENCE} : ${key}`)
  }
}

// 3 : une clé est utilisée si son nom apparaît dans le code. Les familles de
// pluriel (`xOne` / `xOther`) sont résolues par leur préfixe.
const sources = SOURCE_DIRS.flatMap((dir) => walk(join(ROOT, dir)))
const code = sources.map((file) => readFileSync(file, "utf8")).join("\n")
for (const key of flat[REFERENCE].keys()) {
  const [namespace, name] = key.split(".")
  if (DYNAMIC_NAMESPACES.has(namespace)) continue
  const base = name.replace(/(One|Other)$/, "")
  if (!code.includes(`"${name}"`) && !code.includes(`${base}$\{`) && !code.includes(`\`${base}`)) {
    problems.push(`clé inutilisée : ${key}`)
  }
}

// 4 : texte accentué hors commentaires dans les fichiers de rendu.
const ACCENTS = /[àâçéèêëîïôûùüœÀÉÈÊ]/
for (const file of TEXT_DIRS.flatMap((dir) => walk(join(ROOT, dir)))) {
  const stripped = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ""))
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)\/\/.*$/, "$1"))
  stripped.forEach((line, index) => {
    if (ACCENTS.test(line)) problems.push(`texte en dur : ${relative(ROOT, file)}:${index + 1}`)
  })
}

if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join("\n"))
  console.error(`\n${problems.length} problème(s) i18n.`)
  process.exit(1)
}
console.log(`i18n OK : ${flat[REFERENCE].size} clés × ${LOCALES.length} langues.`)
