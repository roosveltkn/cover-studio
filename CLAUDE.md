# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Cover Studio: a free, open-source, 100% client-side cover generator. The user imports app screenshots, picks a template and a brand colour, and exports a PNG. Code comments, docs and commit-adjacent text are in French; UI strings exist in French (reference) and English.

## Commands

Package manager is pnpm (Node 20+).

```bash
pnpm dev            # dev server
pnpm build          # static export to out/
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm i18n:check     # translation consistency (keys, interpolation vars, hardcoded UI text)
pnpm test           # Vitest unit tests (tests/unit)
pnpm test:e2e       # builds then runs Playwright against out/ (tests/e2e)
pnpm format         # Prettier (ts/tsx)
```

CI runs lint, typecheck, i18n:check, unit tests, build and the Playwright E2E tests. All tests live in `tests/` (`tests/unit`, `tests/e2e`); `tests/unit/templates-contract.test.ts` and `tests/e2e/export.spec.ts` loop over the template registry, so a new template is covered without writing a test. E2E selectors use accessible roles and text read from `messages/*.json`, never hardcoded labels. PRs target `develop`; `main` only receives releases. Commits follow Conventional Commits.

## Architecture

- **Static export** (`output: "export"` in `next.config.ts`): no server, no proxy/middleware, no API routes. Anything needing a server is out of scope (see `docs/SPECS.md` non-goals). Images never leave the browser.
- **Routing/i18n**: pages live under `app/[locale]/` (`/fr`, `/en`, `/{locale}/editor`); `app/(root)/page.tsx` redirects `/` client-side using `i18n/detect.ts`. i18n is a home-made layer in `i18n/` (no library). `messages/fr.json` is the type reference: an unknown key in `t("…")` or a key missing from another locale breaks `pnpm typecheck`. Never hardcode UI text; add keys to both `messages/fr.json` and `messages/en.json`. Static data (schemas, templates, slots) carries message *keys* (`labelKey`, `nameKey`), resolved at render. `lib/` stays React-free and throws coded errors that the calling component translates. Details in `docs/I18N.md`.
- **Single config object**: `CoverConfig` (`types/cover.ts`) describes the whole cover (template id, content, style, mockups, export). It lives in the Zustand store (`stores/cover-store.ts`, persisted), mutated via `setField("dotted.path", value)`. UI state that must survive a locale switch (e.g. active panel) also lives in the store, because changing language recreates the page. Sample texts in `templates/showcase/defaults.ts` are re-localized on locale change without overwriting user edits (`localizeContent`).
- **Templates** (`templates/`): each template is a React component receiving `{ config: PlacedConfig }`, drawn in pixels on a fixed canvas (`COVER_SIZE` in `templates/shared/mockups.ts`); preview and export scale it. A template is registered in `templates/registry.ts` with a field `schema` (`templates/shared/schema.ts`) and screenshot `slots`. The editor panels are generated from the schema (`components/editor/schema-field.tsx`), so adding a field type means touching `types/cover.ts` `FieldSchema` and the renderer.
- **Screenshot placement**: `lib/slots.ts` `placeImages` turns the ordered `mockups.images` list into `PlacedConfig` (`desktopImage`, `mobileImage*`) by orientation (landscape → browser frame, portrait → phone frame). Templates only read the placed fields.
- **Colour/export**: palettes are derived from `style.brandColor` in `lib/color.ts` (culori). Export (`lib/export.ts`, `components/editor/use-export.ts`) renders the template DOM to PNG with `html-to-image`; sizes are in `lib/export-sizes.ts`, fonts in `lib/fonts.ts`.
- **Analytics** (`lib/analytics.ts`): optional GA4, enabled only when `NEXT_PUBLIC_GA_ID` is set (see `.env.example`); calls are no-ops otherwise.
- UI primitives in `components/ui/` are shadcn (Base UI + Tailwind 4); import via the `@/` alias.

## Adding things

See `CONTRIBUTING.md` for the step-by-step "add a template" flow (component, schema, slots, registry entry, `templates` message keys in both locales) and `docs/I18N.md` for adding a language.
