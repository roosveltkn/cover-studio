# Inline editing on the cover — Specification

> Status: levels 1 and 2 implemented
> Complements [SPECS.md](./SPECS.md) §6 and §9

---

## 1. Goal

Edit texts **directly on the preview**, as in Canva: click the name, type, and a floating toolbar
adjusts the size, font and colour of the selected element. The left panel remains the complete,
accessible path; inline editing is an addition, it replaces nothing.

## 2. Scope

### 2.1 Level 1 — text editable in place
- Hovering a text of the main preview: thin outline, text cursor.
- **Click** on an unselected text: it is selected (frame + toolbar).
- **Click on the selected text, double-click, or Enter** from the keyboard: editing starts, caret
  placed at the clicked point (at the end of the text from the keyboard).
- Typing updates the cover and the panel live (same `content.*` field as the form).
- **Enter** or **Escape** commit and leave editing; clicking elsewhere does too. **Escape** outside
  editing deselects (except from a panel field or an open popup).
- Clicking the stage background (outside the cover): deselection.
- Texts covered: badge (`badge`), name (`nameMain`, `nameAccent`), description, chips (one by one),
  footer (`footer`).
- The matching panel field is highlighted while an element is selected.

### 2.2 Level 2 — contextual toolbar
Shown above the selected element (below it when there is not enough room), inside the window:
- **Size**: − / percentage / +, reset. Writes `style.textScale[element]` (already existing, bounded
  by `SCALE_MIN`–`SCALE_MAX`).
- **Font**: template font (default) or one of the `FONTS`. Writes `style.textFont[element]`.
- **Colour**: picker + suggested colours, reset. Writes `style.textColor[element]`.
- **Edit text**: starts editing (useful from the keyboard and on touch devices).
- **Close**: deselects.
- Clicking the toolbar does not take focus away from a text being edited: the size can be changed
  while typing.

Settings apply to the **element** (all chips together, the whole name), not to a single chip.

### 2.3 Out of scope (level 3, later)
Moving, resizing with handles, rotation, snapping guides, adding free elements, undo/redo
(`zundo`), deleting a text from the toolbar.

## 3. Editing rules

| Rule | Behaviour |
|---|---|
| Plain text | `contentEditable="plaintext-only"`: no pasted formatting. |
| Single line | Line breaks (typed or pasted) become spaces. |
| Maximum length | The template schema's `maxLength`, enforced while typing. |
| Emptied text | Not written to the store while typing (the element would vanish under the caret); on commit, the main name (required) gets its original value back, an empty chip is removed, other fields become empty and the element disappears. |
| Description | The N-line clamp (`line-clamp`) is lifted while editing in `TextBlock`; templates with their own text layout keep it. |
| Name accent | The custom name colour applies to the main part; the accent keeps the template's accent colour. |

## 4. Data model

Additions to `CoverConfig["style"]`, persisted like the rest of the style:

```ts
textFont?: Partial<Record<TextElement, string>>   // font id (lib/fonts)
textColor?: Partial<Record<TextElement, string>>  // hex
```

UI state in the store, **not persisted**:

```ts
selection: { element: TextElement; path: string } | null   // path: "content.badge", "content.chips.2"…
editing: boolean
```

## 5. Architecture

- **`templates/shared/editable.tsx`**: `EditingContext` and `<EditableText field index? />`.
  Templates stay independent from the store: the context provides the callbacks (`select`,
  `startEditing`, `update`, `commit`) and `maxLength`.
  - Without context (thumbnails, non-main preview): same output as before, plus a styled `<span>`
    only when a custom font or colour exists — it must show in thumbnails and in the export.
  - With context: a clickable `<span data-edit-path>`; while editing, the span is remounted
    (different element) and **not controlled** by React (text set on entry, read on each `input`)
    so the caret is never lost.
- **`TextBlock`, `Chips`, `Footer`** use `EditableText`: 11 templates covered at once; brutal,
  editorial, poster, store and terminal are adapted by hand.
- **`components/editor/inline-editing.tsx`** builds the context from the store and computes the
  selection frame (`getBoundingClientRect`, `ResizeObserver`); **`text-toolbar.tsx`** renders the
  toolbar in a fixed-position portal.
- **Export**: the frame and the toolbar live **outside** the exported node; the hover outline is a
  CSS `outline` (absent from the export, the mouse being on the button). The selection is cleared
  before exporting.
- Only the main preview (`CanvasStage`) enables editing; `FitPreview` never receives it.

## 6. Accessibility

- Editable texts are focusable (`tabIndex=0`, `role="button"`, `aria-label` = field label); Enter
  starts editing (`role="textbox"`).
- The toolbar is a labelled `role="toolbar"` with named buttons; its texts live in
  `messages/*.json`.
- The panel keeps every feature: inline editing is never the only path.

## 7. Acceptance criteria

1. Clicking then typing on a cover's name changes the name in the preview and in the panel field.
2. Enter commits; Escape deselects; the exported PNG contains neither frame nor toolbar.
3. The toolbar changes the element's size, font and colour; thumbnails and the export reflect them.
4. All templates expose their texts to inline editing (contract test).
5. No hard-coded UI text; `pnpm i18n:check`, `typecheck`, `lint`, unit and E2E tests pass.
