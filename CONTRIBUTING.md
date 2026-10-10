# Contributing to Cover Studio

Thanks for your interest! This guide explains how to propose an improvement.

By taking part, you agree to the [code of conduct](./CODE_OF_CONDUCT.md). Your contributions are
released under the project's [MIT license](./LICENSE).

## Before you start

- For a bug: search the [issues](https://github.com/roosveltkn/cover-studio/issues) first, then open
  one with the "Bug" template.
- For a new feature: open a "Feature" issue **before** writing code, to check that it fits the
  project's scope (see the "Non-goals" section of `docs/SPECS.md`).
- Issues labelled `good first issue` and `help wanted` are a good place to start.

## Setup

Requirements: Node.js 20+ and pnpm 10.

```bash
git clone https://github.com/<your-account>/cover-studio.git
cd cover-studio
pnpm install
pnpm dev
```

> **Heads-up**: this version of Next.js has breaking changes compared with what you may know.
> Read the local documentation in `node_modules/next/dist/docs/` before changing routing or
> configuration conventions (see also `AGENTS.md`).

## Workflow

1. Fork the repository and create a branch from `develop`: `feat/short-name` or `fix/short-name`.
2. Keep changes focused: one PR, one topic.
3. Before pushing, run:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm i18n:check
   pnpm test
   pnpm test:e2e
   pnpm format
   ```

   If you touch the capture service (`capture/`), also run `pnpm capture:typecheck` and
   `pnpm capture:test`.

   `pnpm test:e2e` builds the site, then runs Playwright; the first time, install the browser with
   `pnpm exec playwright install chromium`. CI runs all of these commands (except `format`), and a
   PR can only be merged when they pass. Tests live in `tests/`: a new template is covered
   automatically by the contract and export tests, it just has to pass them.
4. Open a PR against `develop` (the preview branch; `main` only receives releases) and fill in
   the template. For any visual change, attach a before/after screenshot or an exported cover.

## URL capture service

Capturing from a URL relies on a separate Vercel project in `capture/`: a headless Chrome that
lists a site's pages and takes screenshots of them. The app stays a static export and only calls
it when `NEXT_PUBLIC_CAPTURE_ENDPOINT` is set; without that variable, the feature is hidden.

To work on it locally:

1. Copy `capture/.env.example` to `capture/.env.local` and set `CHROME_PATH` to your installed
   Chrome (the service's Chromium build only runs on Linux).
2. Run `pnpm capture:dev` (service on <http://localhost:3001>).
3. In the root `.env.local`, set `NEXT_PUBLIC_CAPTURE_ENDPOINT=http://localhost:3001`, then run
   `pnpm dev`.

The API contract, security rules (SSRF guard) and deployment are described in
[docs/CAPTURE.md](./docs/CAPTURE.md). End-to-end tests mock the service with `page.route`, so no
remote Chrome is needed in CI.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `refactor:`, `chore:`…), in English or French.
- **Code**: strict TypeScript, Prettier (`pnpm format`), imports through the `@/` alias. Code
  comments are written in French, like the rest of the codebase.
- **UI text**: never hard-coded in components. Add the key to `messages/fr.json` **and**
  `messages/en.json`, then run `pnpm i18n:check`. Details in [docs/I18N.md](./docs/I18N.md).
- **No licensed assets**: frames, icons and illustrations must be drawn by you or come from a
  source compatible with MIT (state it in the PR). No brand logos or third-party app screenshots
  without permission.
- **Client-side first**: no backend for the app, no image upload, no trackers. The optional
  capture service is the only server-side part, and it never receives user images.
- **Dependencies**: add as few as possible and justify them in the PR.

## Adding a template

A template = a React component + a field schema + an entry in the registry.

1. Create `templates/<my-template>/Template.tsx`, exporting a component that receives
   `{ config: PlacedConfig }` (see `types/cover.ts`). The canvas is `COVER_SIZE`
   (`templates/shared/mockups.ts`, 2400 × 1500); draw everything in pixels at that size, and the
   preview and export handle the scaling.
2. Reuse the existing building blocks: `templates/shared/` (text blocks, mockups),
   `mockups/BrowserFrame.tsx` and `mockups/PhoneFrame.tsx`, and `lib/color.ts` to derive the palette
   from `style.brandColor`.
3. Pick a field schema: `baseSchema` (browser + phone) or `mobileTrioSchema` (three phones), or
   create one in `templates/shared/schema.ts`.
4. Declare the screenshot slots: `BROWSER_AND_PHONE`, `THREE_PHONES` or your own (in
   `templates/registry.ts`).
5. Register the template in `templates/registry.ts` (`id`, `nameKey`, `descriptionKey`, `size`,
   `component`, `schema`, `slots`).
6. Add its name and description to the `templates` namespace of `messages/fr.json` and
   `messages/en.json`.
7. Check it: run `pnpm dev`, open the editor, and try it with 0, 1 and several screenshots, long
   texts and several brand colours, in light and dark mode. Export a PNG, make sure it matches the
   preview, and attach it to the PR.

## Adding a language

Follow the "Adding a language" section of [docs/I18N.md](./docs/I18N.md).

## Review

A maintainer will review your PR as soon as possible. Be ready to iterate: feedback is not a
rejection. PRs are squash-merged and the PR title becomes the commit message, so follow
Conventional Commits.

## Security

Don't report a vulnerability in a public issue: see [SECURITY.md](./SECURITY.md).
