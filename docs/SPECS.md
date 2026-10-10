# App cover generator: specification

> Name: Cover Studio
> Status: original V1 specification, kept as the design reference. The project has since gone
> beyond V1 (16 templates, several export formats, fr/en, URL capture): see the
> [README](../README.md) for the current state.
> License: open source (MIT)

---

## 1. Context and goal

Developers need presentation visuals for their apps (portfolio, GitHub README, Product Hunt,
LinkedIn). Making them in Figma or Canva is slow and hard to reproduce.

**Goal**: a free, open-source web app that generates a presentation cover from 2 screenshots, a
few texts and a brand colour.

**Visual reference**: three existing covers (Portf.app, OngolaPhone, Klivar) that share the same
layout. V1 reproduces that layout.

## 2. Scope

### 2.1 In V1
- A single template (the layout of the 3 reference covers)
- Content editing: texts, chips, screenshots
- A single brand colour, from which the whole palette is derived
- Live preview
- 2400×1500 PNG export

### 2.2 Out of V1
- ~~Several templates~~: delivered (see `templates/registry.ts`)
- ~~Other export ratios~~: delivered (cover, Open Graph, GitHub, X, Product Hunt, square)
- ~~Localisation / multiple languages~~: delivered in fr/en, see [I18N.md](./I18N.md)
- CLI and GitHub Action
- User accounts, cloud saving, application backend (the optional, stateless URL capture service
  is the only exception: see 6.7)

### 2.3 Non-goals
- It is not a free-form design editor (no drag and drop of elements)
- It is not a store screenshot generator (App Store / Play Store)

## 3. Principles

1. **100% client-side**: no image is sent to a server. The one optional exception: capturing from
   a URL (6.7) sends the **typed address** to the capture service. Imported images never leave
   the browser.
2. **No account**: the user opens the page and exports.
3. **A single required style field**: the brand colour. Everything else is derived.
4. **Template = component + props schema**, so that templates can be contributed through PRs.
5. **No licensed assets**: browser and phone frames are drawn in SVG/CSS.

## 4. Layout anatomy

**2400 × 1500 px** canvas (16:10). The values below were measured on the reference covers and are
to be adjusted during implementation.

```
┌────────────────────────────────────────────────────────────────────┐
│ background: gradient + grid + halo (top right)                     │
│                                                                    │
│  [BADGE]                       ┌───────────────────────────┐       │
│                                │ ● ● ●  [🔒 url]           │       │
│  Name                          │                           │       │
│  Description                   │   desktop screenshot      │       │
│  on 3 lines                    │                      ┌────┴────┐  │
│                                │                      │ mobile  │  │
│  [chip] [chip]                 └──────────────────────│         │  │
│  [chip] [chip]                                        └─────────┘  │
│                                                                    │
│  footer                                                            │
└────────────────────────────────────────────────────────────────────┘
```

| Area | Approximate position (px) |
|---|---|
| Left column | x = 135, width ≈ 720 |
| Badge | y ≈ 285 to 346 |
| Name | y ≈ 400 to 500, size ≈ 110 px |
| Description | below the name, size ≈ 32 px, 3 lines |
| Chips | below the description, automatic wrapping |
| Footer | y ≈ 1375 |
| Browser | x ≈ 900 to 2190, y ≈ 180 to 1100/1170 |
| Phone | x ≈ 1907 to 2308, y ≈ 510 to 1430 |

Fixed elements: browser traffic lights, URL bar with a padlock, black phone frame with a dynamic
island, typography, spacing, badge shape (rounded outline) and chip shape (translucent white
background).

## 5. Data model

```ts
type CoverConfig = {
  content: {
    badge: string;            // shown in spaced capitals
    nameMain: string;         // first part of the name
    nameAccent?: string;      // optional second part (e.g. "Ongola" + "Phone")
    description: string;
    chips: string[];          // dynamic list, any number
    footer: string;           // free text (e.g. "klivar.fr · Tech Lead")
    browserUrl: string;       // URL shown in the browser bar
  };
  style: {
    brandColor: string;       // hex, the only required field
    accentColor?: string;     // override for the nameAccent colour (V1.1)
    haloIntensity?: number;   // 0–1 (V1.1)
    gridOpacity?: number;     // 0–1, 0 = disabled (V1.1)
  };
  mockups: {
    desktopImage?: ImageAsset;
    mobileImage?: ImageAsset;
    browserTheme?: "auto" | "light" | "dark";   // V1.1
    desktopCropY?: number;                       // vertical offset, 0–1 (V1.1)
  };
  layout?: {                                     // V2
    mirror?: boolean;                            // text on the right, mockups on the left
    phonePosition?: "bottom-right" | "bottom-left";
  };
  export: {
    format: "png";
    scale: 1 | 2;
  };
};

type ImageAsset = {
  dataUrl: string;
  width: number;
  height: number;
};
```

The implemented model has since grown (an ordered list of screenshots, per-template fields): see
`types/cover.ts`.

## 6. Features

### 6.1 Content (V1)

| Field | Type | Constraint |
|---|---|---|
| Badge | text | ~40 characters max, turned into capitals by the template |
| Name (part 1) | text | required |
| Name (part 2) | text | optional |
| Description | multi-line text | ~160 characters max recommended |
| Chips | list | add / remove, any number, automatic wrapping |
| Footer | text | free |
| Browser URL | text | independent from the footer |

### 6.2 Mockups (V1)

- Separate upload of the desktop and mobile screenshots (PNG, JPEG, WebP)
- Each mockup is optional: the layout must stay valid with desktop only, mobile only, or both
- Browser height: follows the screenshot's ratio, within a minimum and a maximum
- The screenshot is shown from the top of the page (`object-fit: cover`, anchored at the top)
- Without an image: a neutral placeholder

### 6.3 Colours (V1)

One brand colour as input (colour picker + hex input). The template derives its whole palette
from it (see §7).

### 6.4 Export (V1)

- "Download PNG" button
- Output size: 2400×1500 (1× scale)
- File name: `<nameMain><nameAccent>-cover.png`, lowercased without spaces

### 6.5 V1.1 additions

- Browser theme: light, dark, or auto (based on the screenshot's average brightness)
- Override for the colour of the name's second part
- Halo and grid settings
- Vertical cropping of the desktop screenshot

### 6.6 V2 additions

- Mirrored layout and phone position
- Extra export ratios: 1:1, 1.91:1 (OG image), 16:9
- Several templates
- 2× scale factor

### 6.7 Capture from a URL

The user pastes their site's address instead of importing files.

1. **Analysis**: the service lists the site's pages (sitemap, then home page links, then a Chrome
   render if the site is an SPA). One level only, 50 pages at most, grouped (home, navigation,
   pages, blog, legal).
2. **Selection**: in a dialog (a bottom drawer on mobile), the user checks pages and devices
   (desktop, mobile). A run captures at most 4 images: 2 pages on both devices, or up to 4 pages on
   a single one. "Preview" shows the desktop capture scaled down; it is kept in memory and reused
   if the page is checked.
3. **Capture**: one WebP image per page and device, which then follows the same path as an
   imported file (`readImage`, gallery, placement by orientation).

Constraints:
- The service is a separate, stateless Vercel project (`capture/`); the app stays a static export.
- The feature only appears when `NEXT_PUBLIC_CAPTURE_ENDPOINT` is set: a fork stays 100% local.
- Pages behind a login and sites protected against robots cannot be captured; manual import
  remains the fallback.

API contract, security and deployment: [CAPTURE.md](./CAPTURE.md).

### 6.8 Inline editing on the preview

Texts editable in place and a floating toolbar (size, font, colour per element), Canva-style. The
panel remains the complete path. Specification: [INLINE-EDITING.md](./INLINE-EDITING.md).

## 7. Palette derivation

From `brandColor` (converted to HSL or OKLCH):

| Element | Rule |
|---|---|
| Bottom-left background | same hue, lightness ≈ 10% |
| Top-right background | `brandColor` |
| Halo | lighter, more saturated hue, wide blur, positioned top right |
| Badge, chips | white at ≈ 8% opacity |
| Button, accents | lightened `brandColor` |
| `nameAccent` colour | auto: light tint on a dark background; dark tint if the background is bright |

**Contrast**: the background colour's relative luminance is computed. If the contrast ratio of
white text falls below 4.5:1 (WCAG AA), the background is darkened until it reaches the
threshold. Cases to test: yellow, cyan, off-white, pure black.

## 8. Technical architecture

### 8.1 Stack

The V1 plan was Vite + React. The project is implemented with:

- **Next.js** (App Router, static export) + **React 19** + **TypeScript**
- **Tailwind CSS 4** and **shadcn/ui** (Base UI) for the editor interface
- **modern-screenshot** for PNG export
- No application backend; static hosting (Vercel). The optional URL capture service is a
  separate Vercel project.

### 8.2 Rendering

- The template is a React component rendered at a real **2400×1500 px**.
- The preview wraps it in a container and applies `transform: scale()` to fit the screen.
- Export captures the component **at its native size**, outside the preview's `scale`.

### 8.3 Repository structure

The actual structure is described in the [README](../README.md#project-structure). The V1 plan
was:

```
/
├─ src/
│  ├─ app/                  # editor shell (form + preview)
│  ├─ templates/
│  │  └─ showcase/          # V1 template
│  │     ├─ Template.tsx
│  │     ├─ schema.ts       # template props schema
│  │     └─ palette.ts      # colour derivation
│  ├─ mockups/
│  │  ├─ BrowserFrame.tsx   # SVG/CSS
│  │  └─ PhoneFrame.tsx     # SVG/CSS
│  ├─ lib/
│  │  ├─ color.ts           # HSL/OKLCH, luminance, contrast
│  │  ├─ export.ts          # modern-screenshot, DOM capture
│  │  └─ image.ts           # file reading, dimensions, validation
│  └─ fonts/                # self-hosted fonts
├─ public/
├─ SPECS.md
├─ README.md
├─ CONTRIBUTING.md
└─ LICENSE
```

### 8.4 Template contract

```ts
type Template = {
  id: string;
  name: string;
  size: { width: number; height: number };
  component: React.ComponentType<{ config: CoverConfig }>;
  schema: FieldSchema[];       // fields exposed to the editor
};
```

Adding a template = a folder in `templates/` + an entry in the registry. The editor generates its
form from `schema`. The implemented contract also declares screenshot `slots` and translation
keys: see [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-template).

## 9. Editor interface

- Two-area layout: **form on the left, preview on the right**; on mobile, the preview moves above.
- Form sections: Content, Colours, Screenshots, Export.
- The preview updates in real time, without an "Apply" button.
- Defaults: a prefilled example (placeholder), so something is visible as soon as the editor
  opens.
- Persistence: text and colours in `localStorage`. Images are not persisted in V1 (size).

## 10. Technical constraints

| Topic | Requirement |
|---|---|
| Fonts | Self-hosted and embedded at export time (otherwise the capture loses them). Wait for `document.fonts.ready` before capturing. |
| Images | Read with `FileReader` as data URLs, no network request. Suggested max size: 10 MB per image. |
| Accepted formats | PNG, JPEG, WebP |
| Memory | A 2400×1500 canvas at 2× is 4800×3000; show an error message if the browser refuses the capture. |
| Target browsers | Recent Chrome, Edge, Firefox, Safari |
| Safari | Export through `modern-screenshot` (redraws images for Safari/iOS): to be checked on a real iPhone |
| Accessibility | Keyboard-navigable editor, form labels, AA-compliant interface contrast |

## 11. V1 acceptance criteria

- [ ] Reproduce the 3 reference covers (Portf.app, OngolaPhone, Klivar) with visual differences
  limited to screenshots and fonts
- [ ] Changing the brand colour updates background, halo, chips and accents with no other setting
- [ ] Text stays readable on at least: indigo, orange, purple, green, yellow, red, black
- [ ] The layout renders correctly with: desktop only, mobile only, both, no image
- [ ] Adding up to 8 chips does not break the layout
- [ ] A 30-character name does not overflow the left column
- [ ] The PNG export is exactly 2400×1500 px and contains the right fonts
- [ ] No network call is made during upload or export (checkable in the Network tab)
- [ ] Export takes less than 3 seconds on an ordinary computer

## 12. Open source

- **License**: MIT
- **Repository**: README with a screenshot, live demo, setup instructions
  (`pnpm install && pnpm dev`)
- **CONTRIBUTING.md**: a "create a template" guide (folder structure, schema, registration in the
  registry, required preview screenshot)
- **Fonts**: free licences only (e.g. OFL), licences listed in the repository
- **Mockups**: drawn in the project, without reproducing official device frames (Apple, Google),
  which avoids licensing questions

## 13. Roadmap

| Version | Content |
|---|---|
| **V1** | Single template, full content, brand colour, 2 screenshots, 2400×1500 PNG export |
| **V1.1** | Browser theme, name colour override, halo and grid, vertical cropping |
| **V2** | Mirrored layout, extra ratios, 2× scale, multi-template system (delivered), first community templates |
| **Later** | CLI / GitHub Action, WebP export |

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Fonts missing from the export | Output differs from the preview | Self-hosting, `document.fonts.ready`, manual export check |
| Insufficient contrast on light colours | Unreadable text | Luminance computation and automatic background darkening |
| Slow or failing export on mobile | Poor experience | Clear error message, recommend desktop for export |
| A single template: little interest for the community | Low adoption | Polish the V1 template, document contributing from V1 |
| Preview and export rendering diverge | Loss of trust | Render the preview from the same component as the export |
| Capture service abused (SSRF, misuse) | Internal network access, costs | Address filter on every request and redirect, allowed origins, Vercel rate limiting, spending cap |

## 15. Open questions

- ~~Project name and domain~~: Cover Studio, coverstudio.roosveltkn.com
- Template font (to pick among free fonts close to the reference covers)
- Animated screenshots (GIF): excluded from V1
- App logo in the layout: not planned in V1; to be decided (an app icon has since been added)
