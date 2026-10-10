# Cover Studio

A free, open-source cover generator for your app: drop in your screenshots (or let Cover Studio
capture your site from its URL), pick a template and a brand colour, and export a PNG ready to
share on a GitHub README, Product Hunt, LinkedIn or your portfolio.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/roosveltkn/cover-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/roosveltkn/cover-studio/actions/workflows/ci.yml)

## Features

- 16 templates (showcase, spotlight, bento, perspective, mobile-trio, aurora, editorial, terminal…)
- Up to 4 screenshots, reordered by drag and drop
- Capture from a URL: the site is analysed, you pick the pages, and they are captured on desktop
  and mobile (optional service, see [docs/CAPTURE.md](./docs/CAPTURE.md))
- One brand colour: the whole palette is derived from it
- Adjustable texts, app icon, typography and sizes
- PNG export in several formats (cover, Open Graph, GitHub, X, Product Hunt, square), in high
  resolution
- Interface in English and French, light and dark themes
- **100% client-side**: no image is ever uploaded and no account is needed. The one optional
  exception: capturing from a URL sends the address you type to the capture service

## Quick start

Requirements: [Node.js](https://nodejs.org) 20 or later and [pnpm](https://pnpm.io) 10.

```bash
git clone https://github.com/roosveltkn/cover-studio.git
cd cover-studio
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Scripts

| Command                  | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm dev`               | development server                                            |
| `pnpm build`             | production build (static export to `out/`)                    |
| `pnpm lint`              | ESLint                                                        |
| `pnpm typecheck`         | TypeScript check                                              |
| `pnpm format`            | Prettier formatting                                           |
| `pnpm i18n:check`        | translation consistency (keys, variables, hard-coded text)    |
| `pnpm test`              | unit tests (Vitest)                                           |
| `pnpm test:e2e`          | build, then end-to-end tests (Playwright)                     |
| `pnpm capture:dev`       | local capture service (`vercel dev`)                          |
| `pnpm capture:test`      | capture service tests                                         |
| `pnpm capture:typecheck` | capture service TypeScript check                              |

## Stack

[Next.js](https://nextjs.org) (App Router, static export) · React 19 · TypeScript ·
Tailwind CSS 4 · shadcn/ui (Base UI) · Zustand · modern-screenshot · dnd-kit.
The optional capture service runs headless Chromium (`puppeteer-core` and `@sparticuz/chromium`)
on Vercel Functions.

## Project structure

```
app/          pages (landing, editor) and SEO metadata
components/   editor, landing and UI components
templates/    one folder per cover template, plus the registry (registry.ts)
mockups/      browser and phone frames (SVG / CSS)
stores/       editor state (Zustand)
lib/          pure logic: colours, images, export, capture client
i18n/         home-made translator; texts live in messages/{fr,en}.json
capture/      URL capture service (separate Vercel project, headless Chrome)
docs/         specification (SPECS.md), internationalisation (I18N.md), capture (CAPTURE.md)
tests/        unit tests (tests/unit) and end-to-end tests (tests/e2e)
```

## Contributing

Contributions are welcome: new templates, export formats, languages, fixes. Read
[CONTRIBUTING.md](./CONTRIBUTING.md), especially [Adding a template](./CONTRIBUTING.md#adding-a-template),
and the [code of conduct](./CODE_OF_CONDUCT.md).

Found a security issue? See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Roosvelt Kenne
