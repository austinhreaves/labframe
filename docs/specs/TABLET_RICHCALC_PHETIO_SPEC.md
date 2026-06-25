# Tablet Layout, Rich Calculations, and PhET-iO Integration Spec

**Status:** In progress. T-A (tablet layout), T-B (touch keyboard), and C-A (image upload) landed on branch `claude/clever-mayer-09af19`. C-B (free draw canvas) and C-C (student-selectable response mode) landed on branch `claude/musing-hamilton-ca5b08`. All of Track C is complete. Track P (PDF report quality): P-A (font embedding) and P-B (titles/prompts) landed on `claude/musing-hamilton-ca5b08`; P-C (drop theory + compact unanswered), P-D (Process Record densification), and P-E (layout/length) landed on `claude/condescending-mendel-c77cc3`; P-F deferred. All of Track S remains.
**Created:** 2026-06-19
**Updated:** 2026-06-24
**Tracks:** Three parallel feature tracks executed in dependency order within each track. Tracks are independent; they may be handed off to agents concurrently or sequentially.

---

## Overview

This spec covers three related capability expansions:

| Track                    | Goal                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| T: Tablet Layout         | Make LabFrame usable on tablet-sized viewports (768px+) without a dedicated mobile layout                                                    |
| C: Rich Calculations     | Add free-draw canvas and image upload as response modes in `CalculationSection`, and let students choose their response mode per calculation |
| S: Sim Capture / PhET-iO | Move from manual screenshot workflow toward PhET-iO native snapshot and engagement data                                                      |

**Non-goals across all tracks:**

- Phone-sized (< 600px) layout. Tablets only.
- Offline / PWA / service worker support.
- Any server-side state storage. The no-backend constraint (ADR-0002) is absolute.
- Weighted or graded engagement metrics in Canvas (read-only telemetry only in Track S).

---

## Track T: Tablet Layout

### T-A: Responsive Layout Pass

**Goal:** Every page in LabFrame -- catalog, lab worksheet, PDF preview -- is usable on a 768px-wide viewport in landscape orientation without horizontal scrolling or broken layout.

**Scope:**

- Audit `src/main.css` for fixed-width containers and magic-number widths. Replace with `max-width` + fluid padding using `var(--space-*)` tokens from `src/ui/tokens.css`.
- Extend the existing `@media (max-width: 880px)` breakpoint set. Add explicit breakpoints at 768px and 1024px using the existing token vocabulary; do not introduce numeric literals.
- Simulation iframes (`SimulationSchema`, rendered via `src/ui/sections/` or equivalent): wrap in an aspect-ratio container (`aspect-ratio: 16/9`) so they scale with viewport width. Add a minimum height floor (`min-height: 360px`) so the sim is still usable.
- Navigation and header: ensure tap targets meet 44px minimum (WCAG 2.5.5).
- Table sections (`DataTableSectionSchema`): horizontal scroll wrapper (`overflow-x: auto`) so wide tables do not break layout. Do not compress columns.
- No layout changes to the PDF renderer -- it always renders at fixed A4 width.

**What to leave for T-B:**

- The equation editor (MathLive) touch behavior.
- Any free-draw canvas touch behavior (that is Track C).
- Accessibility audit beyond tap targets.

**Files to read before starting:**

- `src/main.css` -- primary layout and breakpoint styles
- `src/ui/tokens.css` -- all spacing, color, and typography tokens
- `src/ui/sections/` -- section view components (audit iframe rendering)

**Acceptance:** Playwright test at 768x1024 viewport (landscape tablet) passes without horizontal scroll on the Snell's Law lab. Record the viewport size in the test name.

---

**Agent handoff -- T-A:**

```
You are implementing Phase T-A of the LabFrame tablet layout spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md).

Goal: make LabFrame usable on 768px-wide viewports without horizontal scrolling or broken layout. This is a CSS-only pass; do not touch component logic.

Key files:
- src/main.css (44KB) -- primary layout, has existing breakpoints at 880px and 720px
- src/ui/tokens.css -- spacing/color/typography design tokens; all new values must use var(--space-*) or var(--text-*) etc., no numeric literals
- src/ui/sections/ -- find how simulation iframes are rendered and wrap them in an aspect-ratio container
- playwright.config.ts -- where to add the 768x1024 viewport test

Rules:
- Extend existing breakpoints; do not add a new breakpoint system
- Simulation iframes: aspect-ratio: 16/9 wrapper, min-height: 360px
- Tables: overflow-x: auto wrapper
- Tap targets: minimum 44px height on all interactive elements
- No changes to the PDF renderer (anything in src/pdf/ or similar)
- No em dashes in any prose or comments

Deliver: CSS changes + one Playwright viewport test confirming no horizontal scroll on the Snell's Law lab at 768x1024.
```

---

### T-B: Touch Interaction Audit

**Goal:** Resolve input and interaction regressions that appear on a physical tablet (stylus or finger). Focus on the equation editor and section-level interactions.

**Scope:**

- **MathLive / EquationEditor on iOS:** MathLive has known conflicts with the iOS virtual keyboard (the native keyboard pops and fights MathLive's virtual keyboard). Options in priority order:
  1. Configure MathLive to use `virtualKeyboardMode: 'onfocus'` with a custom small keyboard layout.
  2. If that is still broken, add a `?forceTextCalc=true` URL flag that suppresses `equationEditor: true` in the section schema, falling back to the plain textarea.
  3. Do not remove the equation editor on desktop.
- **Scroll behavior:** On iOS Safari, `position: sticky` elements and scroll restoration behave differently. Audit section headers and the TOC sidebar.
- **Drag on data tables:** If table row drag-to-reorder exists, ensure it has a touch fallback or is disabled on touch (show a tooltip explaining desktop requirement).
- **Button states:** Verify `hover` styles do not leave phantom hover states on touch (use `@media (hover: hover)` guards in CSS).

**Files to read before starting:**

- `src/ui/primitives/mathlive.css` -- MathLive overrides
- The EquationEditor component (find via `grep -r "EquationEditor" src/`)
- `src/ui/sections/CalculationSectionView.tsx`

**Acceptance:** Manual verification checklist on Safari iOS (or BrowserStack equivalent):

- [ ] Equation editor opens and accepts input without keyboard conflict
- [ ] Fallback textarea works when equation editor is unavailable
- [ ] No sticky element positioning bugs on scroll
- [ ] All buttons have correct active state on tap

---

**Agent handoff -- T-B:**

```
You are implementing Phase T-B of the LabFrame tablet layout spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md). Phase T-A (CSS layout pass) is complete.

Goal: audit and fix touch interaction regressions, focused on the MathLive equation editor on iOS and general touch UX.

Key files to find and read first:
- src/ui/sections/CalculationSectionView.tsx
- src/ui/primitives/mathlive.css
- Find the EquationEditor component: grep -r "EquationEditor" src/
- src/ui/tokens.css (for @media (hover: hover) guard pattern)

Tasks:
1. Read the MathLive docs approach for virtualKeyboardMode. Configure it in the EquationEditor component so it uses 'onfocus' mode and a compact keyboard.
2. Add a URL param ?forceTextCalc=true that globally suppresses equationEditor: true when touch is detected (navigator.maxTouchPoints > 0 or URL param). This is a fallback only -- do not remove the editor on desktop.
3. Audit CSS for hover-only styles that would leave phantom states on touch. Wrap them in @media (hover: hover).
4. Check for any drag-and-drop interactions on tables and add a touch guard or tooltip.

Rules:
- No em dashes in prose or comments
- Do not change the CalculationSection schema
- Equation editor must remain fully functional on desktop
```

---

## Track C: Rich Calculations

### C-A: Image Upload in Calculations

**Goal:** Add an image upload response mode to `CalculationSection` so students can photograph handwritten work and attach it directly to a calculation prompt, rather than uploading to a separate `ImageSection`.

**Schema changes (`src/domain/schema/lab.ts`):**

- Add `responseMode: z.enum(['text', 'image', 'draw']).optional()` to `CalculationSectionSchema`. Default (undefined) means `'text'` for backward compatibility.
- `equationEditor` retains its meaning within `responseMode: 'text'`; it is ignored when mode is `'image'` or `'draw'`.
- Add `maxMB: z.number().positive().optional()` (matches `ImageSectionSchema`).

**Answers schema (`src/domain/schema/answers.ts` or equivalent):**

- When `responseMode === 'image'`, the answer value for this `fieldId` must be stored as an image blob in IndexedDB using the same key scheme as `ImageSection` (see ADR-0003 and `src/domain/store/` or equivalent). The `FieldValue.text` field holds the blob key reference; the blob itself lives in IndexedDB.
- Do not duplicate the image storage logic; extract or reuse the existing `ImageSection` blob helpers.

**View (`src/ui/sections/CalculationSectionView.tsx`):**

- When `section.responseMode === 'image'`, render an upload button and thumbnail preview (same UI as `ImageSectionView` but without the separate caption field).
- When `section.responseMode === 'text'` (or undefined), render existing textarea / equation editor unchanged.
- Phase C-B will add the `'draw'` branch; leave a `// TODO: C-B` comment placeholder in the switch.

**PDF rendering:**

- When mode is `'image'`, embed the image inline at the calculation section in the PDF (same as `ImageSection` PDF rendering). Ensure the image SHA-256 is included in the canonical envelope per the binding decision 8 in `docs/SPEC.md` (currently not implemented -- implement it here for calculation images).

**Files to read before starting:**

- `src/domain/schema/lab.ts` -- current CalculationSectionSchema (line 116)
- `src/ui/sections/CalculationSectionView.tsx`
- `src/ui/sections/ImageSectionView.tsx` (or equivalent) -- reuse its upload/preview logic
- `src/domain/store/` -- how image blobs are stored in IndexedDB

**Acceptance:** A lab config with `{ kind: 'calculation', responseMode: 'image', fieldId: 'calc-photo', prompt: '...' }` renders an upload button, stores the blob in IndexedDB, and the exported PDF embeds the image at that section.

---

**Agent handoff -- C-A:**

```
You are implementing Phase C-A of the LabFrame rich calculations spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md).

Goal: add an image upload response mode to CalculationSection so students can attach a photo of handwritten work directly to a calculation prompt.

Read these files first (in this order):
1. src/domain/schema/lab.ts -- focus on CalculationSectionSchema (line ~116) and ImageSectionSchema (line ~108)
2. src/ui/sections/CalculationSectionView.tsx
3. Find ImageSectionView: ls src/ui/sections/
4. Find IndexedDB / blob storage helpers: grep -r "IndexedDB\|imageBlob\|blob" src/domain/

Schema change:
- Add to CalculationSectionSchema: responseMode: z.enum(['text', 'image', 'draw']).optional()
- Add maxMB: z.number().positive().optional()
- Inferred TypeScript type will update automatically

View change (CalculationSectionView.tsx):
- If responseMode === 'image': render upload button + thumbnail (reuse ImageSectionView internals, do not copy-paste the blob storage logic -- extract a shared hook or helper if needed)
- If responseMode === 'text' or undefined: existing behavior unchanged
- Leave a // TODO: Phase C-B -- draw canvas branch comment where 'draw' would go

PDF: ensure calculation image sections embed the image in the PDF and include image SHA-256 in the canonical envelope (see SPEC.md binding decision 8).

Rules:
- Backward compat: undefined responseMode == 'text'; no migration needed
- No em dashes in prose or comments
- Do not add a caption field -- calculation image mode has no separate caption
```

---

### C-B: Free Draw Canvas

**Goal:** Add a free-draw canvas response mode to `CalculationSection` for stylus or mouse input, primarily targeting tablet users with a stylus.

**Canvas implementation:**

- Use a `<canvas>` element with `pointer-events` (supports both stylus and mouse; works on iPad with Apple Pencil via `PointerEvent.pointerType === 'pen'`).
- Stroke data format: serialize as an array of stroke objects `{ color, width, points: [{x, y, pressure}] }`. Store the serialized JSON in `FieldValue.text` under the draw storage key `${fieldId}__draw` (see C-C "Storage keys") so a later student-selectable section can hold text, draw, and image answers side by side without collision. Strokes are small enough for localStorage; no IndexedDB blob needed unless stroke count grows large.
- Render: on load, deserialize strokes and redraw to canvas. This is synchronous and fast.
- Export for PDF: call `canvas.toDataURL('image/png')` to get a data URL; embed as an image in the PDF at that section. The SHA-256 of the PNG bytes goes in the canonical envelope.
- Controls: color picker (black default, 3-4 preset colors), stroke width toggle (thin/thick), eraser toggle, clear button. Do not build a full drawing toolbar; keep it minimal.
- Pressure sensitivity: use `PointerEvent.pressure` to modulate stroke width when `pointerType === 'pen'`. Graceful fallback (constant width) when pressure is 0 or unavailable.

**Undo:** Implement single-level undo (remove the last stroke from the array and redraw). Keyboard shortcut `Ctrl+Z` / `Cmd+Z` when the canvas is focused.

**Sizing:** Canvas fills the section width. Fixed height of 240px default; allow `rows` field in schema to map to multiples of 80px (3 rows = 240px, same as current textarea default).

**Schema:** `responseMode: 'draw'` is already added in C-A. No additional schema changes.

**Files to read before starting:**

- `src/domain/schema/lab.ts` -- confirm responseMode enum includes 'draw' (from C-A)
- `src/ui/sections/CalculationSectionView.tsx` -- find the // TODO: Phase C-B placeholder
- `src/pdf/` or equivalent PDF renderer -- how images are embedded (to add canvas PNG export)

**Acceptance:** A lab with `{ kind: 'calculation', responseMode: 'draw', fieldId: 'hand-calc' }` renders a drawable canvas; strokes persist on page reload; exported PDF embeds the drawing as a PNG.

---

**Agent handoff -- C-B:**

```
You are implementing Phase C-B of the LabFrame rich calculations spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md). Phase C-A is complete: CalculationSectionSchema already has responseMode: z.enum(['text', 'image', 'draw']).optional() and the view has a // TODO: Phase C-B placeholder comment.

Goal: implement the free-draw canvas response mode for CalculationSection.

Read these files first:
1. src/ui/sections/CalculationSectionView.tsx -- find the C-B placeholder
2. src/domain/schema/lab.ts -- confirm schema from C-A
3. Find the PDF image embedding code: grep -r "toDataURL\|embedImage\|canvas" src/pdf/ or src/services/

Canvas implementation:
- Use <canvas> with pointer events (PointerEvent API, not MouseEvent). Support pen, mouse, and touch.
- Stroke data: array of { color: string, width: number, points: Array<{x: number, y: number, pressure: number}> }
- Serialize strokes to JSON and store in FieldValue.text under the key `${fieldId}__draw` (see C-C "Storage keys"; localStorage is fine -- strokes are small)
- On mount: deserialize and redraw all strokes
- Controls: color (black default + 3 presets), stroke width (2 toggles: thin 2px / thick 5px), eraser, clear
- Pressure: use PointerEvent.pressure * baseWidth when pointerType === 'pen', else constant baseWidth
- Undo: Ctrl+Z / Cmd+Z removes last stroke and redraws
- Canvas height: 80px * (section.rows ?? 3) = 240px default; full section width

PDF export:
- In the PDF renderer, when responseMode === 'draw': call canvas.toDataURL('image/png'), compute SHA-256 of the resulting bytes, embed as image at that section. Reuse the image embedding path from C-A if possible.

Rules:
- No em dashes in prose or comments
- Keep toolbar minimal -- resist adding more tools than specified
- Graceful degradation: if canvas is not supported, fall back to text mode with a note
```

---

### C-C: Student-Selectable Response Mode

**Goal:** Let a student choose how to answer a calculation -- type (text or equation), draw (stylus or mouse canvas), or photo (image upload) -- per section, instead of the lab author forcing a single mode. This makes "show your work" prompts flexible: a student can type LaTeX, sketch a free-body diagram, or photograph handwritten algebra, whichever fits the problem.

**Relationship to C-A / C-B:** This phase reuses their input components and per-mode PDF rendering. It depends on C-A for the image path and C-B for the draw path. The `text` and `image` modes work without C-B; the `draw` mode requires C-B. An author may enable `['text', 'image']` before C-B ships.

**Schema changes (`src/domain/schema/lab.ts`, `CalculationSectionSchema`):**

- Add `responseModes: z.array(z.enum(['text', 'draw', 'image'])).min(1).optional()`. When present with 2+ entries, the student sees a mode switcher offering exactly those modes, in that order; the first entry is the default. Absent (or a single entry) preserves today's author-controlled behavior.
- Precedence: if `responseModes` has 2+ entries it governs the section and the singular `responseMode` is ignored. `responseMode` (singular) is retained for author-forced single-mode sections and backward compatibility.
- `equationEditor` continues to control whether the `text` mode uses MathLive or a plain textarea.
- Backward compat: existing sections without `responseModes` are unchanged; no migration.

**Storage keys (canonical for all three modes; also adopted by C-B):**
Each calculation's answers are keyed off its `fieldId` so all enabled modes coexist without collision, and entered work is never silently dropped when the student switches modes:

- `text` / equation answer -> `fields[fieldId]` (existing `FieldValue`)
- `draw` answer (stroke JSON) -> `fields[`${fieldId}\_\_draw`]`
- `image` answer (blob) -> `images[section.imageId ?? `${fieldId}\_\_image`]`
- selected mode -> a new `responseSelections: Record<fieldId, 'text' | 'draw' | 'image'>` map

**Store / persistence (`src/state/labStore.ts`, `src/state/persistence/types.ts`):**

- Add `responseSelections` to `LabStoreState` and `PersistedLabState`; in `initLab`, default each selectable section to its first `responseModes` entry.
- Add a `setResponseSelection(fieldId, mode)` action. Switching modes only changes the selection; it does not clear any mode's stored answer.
- Persist `responseSelections` through the existing debounced save path.

**View (`src/ui/sections/CalculationSectionView.tsx`):**

- When `responseModes` has 2+ entries, render a mode switcher above the input: a labelled segmented control / tablist with one button per allowed mode ("Type", "Draw", "Photo"). The active selection comes from `responseSelections[fieldId]`.
- Render the input for the active mode by reusing the existing branches (text -> `Field` / `EquationEditor`, image -> `FileDropzone` keyed to the derived imageId, draw -> the C-B canvas keyed to `${fieldId}__draw`).
- Switching modes preserves each mode's entered data.
- Accessibility: the switcher is a real tablist or radiogroup, keyboard-navigable, each option labelled; the active input keeps its association with the section prompt. The switcher buttons meet the 44px coarse-pointer target from T-A.
- Single-mode sections (no `responseModes`) render exactly as today, with no switcher.

**Export / PDF (`src/services/pdf/Document.tsx`, `src/services/integrity/buildAnswers.ts`):**

- The PDF renders the **active** mode's answer for the section (text, embedded drawing PNG, or embedded photo), reusing the per-mode rendering from C-A / C-B.
- Record `responseSelections` in the canonical envelope so the grader sees which mode each answer used; it is part of the signed payload.
- Non-active answers the student also entered remain in the envelope under their keys (process-tracking value) but are not drawn in the PDF body. This is deliberate, not an omission (see Open decisions).
- Image SHA-256 (C-A) and drawing PNG SHA-256 (C-B) handling are unchanged.

**Files to read before starting:**

- `src/domain/schema/lab.ts` -- `CalculationSectionSchema`
- `src/ui/sections/CalculationSectionView.tsx` -- existing mode branches from C-A / C-B
- `src/state/labStore.ts` -- `initLab`, field / image init, persistence subscriber
- `src/state/persistence/types.ts` -- `PersistedLabState`
- `src/services/integrity/buildAnswers.ts` and `src/services/pdf/Document.tsx` -- envelope + PDF rendering

**Acceptance:** A calculation with `responseModes: ['text', 'draw', 'image']` renders a three-way switcher; the student can type, draw, and attach a photo; each mode's answer persists independently across reload; switching modes does not lose data; the exported PDF shows the active mode's answer; and the envelope records the selected mode. A section without `responseModes` behaves exactly as before.

---

**Agent handoff -- C-C:**

```
You are implementing Phase C-C of the LabFrame rich calculations spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md). Phases C-A (image upload) and C-B (free draw canvas) are complete; their input components and per-mode PDF rendering already exist in CalculationSectionView and Document.tsx.

Goal: let a student choose their response mode (Type / Draw / Photo) per calculation, instead of the author forcing one.

Read first:
1. src/domain/schema/lab.ts -- CalculationSectionSchema
2. src/ui/sections/CalculationSectionView.tsx -- the existing text / image / draw branches
3. src/state/labStore.ts -- initLab, field and image initialization, the persistence subscriber
4. src/state/persistence/types.ts -- PersistedLabState
5. src/services/integrity/buildAnswers.ts and src/services/pdf/Document.tsx

Schema:
- Add responseModes: z.array(z.enum(['text','draw','image'])).min(1).optional() to CalculationSectionSchema
- If responseModes has 2+ entries it wins; the first entry is the default; singular responseMode is ignored for that section
- Keep responseMode (singular) for backward compatibility; sections without responseModes are unchanged

Storage keys (must coexist without collision):
- text / equation -> fields[fieldId]
- draw strokes -> fields[`${fieldId}__draw`]   (same key C-B uses)
- image blob -> images[section.imageId ?? `${fieldId}__image`]
- selected mode -> new responseSelections: Record<fieldId, 'text'|'draw'|'image'> in store + PersistedLabState

Store:
- Add responseSelections to LabStoreState and PersistedLabState; default each selectable section to its first responseModes entry in initLab
- Add setResponseSelection(fieldId, mode); switching modes must NOT clear any mode's stored answer
- Persist responseSelections through the existing debounced save path

View:
- When responseModes has 2+ entries, render a labelled tablist / radiogroup switcher (Type / Draw / Photo) above the input; active = responseSelections[fieldId]
- Render the active mode's input by reusing the existing branches; switching preserves each mode's data
- Accessibility: real tablist or radiogroup, keyboard navigable, labelled; switcher buttons already meet 44px on coarse pointers (T-A)

PDF / envelope:
- Render the active mode's answer in the PDF (reuse the C-A image embed and the C-B drawing embed)
- Record responseSelections in the canonical envelope (signed); leave non-active answers in storage but do not render them in the PDF body
- Do not change the SHA-256 handling from C-A / C-B

Rules:
- No em dashes in prose or comments
- Backward compat: no responseModes == current single-mode behavior, no migration
- Verify types with `npm run typecheck` (tsc -b), NOT `npx tsc --noEmit`; declare undefined-accepting optionals as `T | undefined`
```

---

## Track S: Sim Capture and PhET-iO Integration

### S-A: Guided Screenshot Capture (No License Required)

**Goal:** Reduce friction for sim screenshot submission by guiding students through a capture-and-upload workflow using the image upload infrastructure from Track C.

**Approach:** This phase does not require a PhET-iO license. It uses the existing `ImageSection` (or the new `responseMode: 'image'` calculation mode from C-A) to receive a screenshot the student captures manually.

**Changes:**

- Add an optional `captureHint: z.boolean().optional()` field to `SimulationSchema`. When true, display a capture prompt callout above or below the sim iframe: "Take a screenshot of your simulation, then upload it below." with platform-specific shortcut hints (Windows: Win+Shift+S; Mac: Cmd+Shift+4; iPad: Power+Volume Up or top button).
- If a section immediately follows a simulation zone and has `responseMode: 'image'` (or is an `ImageSection`), style it visually as a pair (remove the visual gap between them) to make the capture-then-upload flow obvious.
- The actual image storage, PDF embedding, and SHA-256 envelope hash use the same path as C-A.

**This is a stopgap.** S-B will replace the manual step with PhET-iO's native screenshot API once the evaluative license is in place.

**Files to read before starting:**

- `src/domain/schema/lab.ts` -- SimulationSchema (line 27)
- The component that renders simulation iframes (find via `grep -r "SimulationSchema\|sim.*iframe\|iframe.*phet" src/`)

**Acceptance:** A lab with `captureHint: true` on a simulation displays the platform-appropriate capture instructions. An `ImageSection` (or `responseMode: 'image'` calculation) immediately following the sim renders with no visual gap between them.

---

**Agent handoff -- S-A:**

```
You are implementing Phase S-A of the LabFrame sim capture spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md).

Goal: guide students through capturing and uploading a sim screenshot using the existing image upload infrastructure (no PhET-iO license needed yet).

Read first:
1. src/domain/schema/lab.ts -- SimulationSchema at line 27
2. Find where simulation iframes are rendered: grep -r "SimulationSchema\|phet\|iframe" src/ui/
3. src/ui/sections/ImageSectionView.tsx or equivalent (to understand upload UI)

Tasks:
1. Add captureHint: z.boolean().optional() to SimulationSchema
2. When captureHint is true, render a callout below the sim iframe:
   "Take a screenshot of your simulation, then upload it below."
   Platform hints (detect via navigator.userAgent or navigator.platform):
   - Windows: Win + Shift + S
   - Mac: Cmd + Shift + 4
   - iPad/iOS: Side button + Volume Up (or Top button)
   Use the existing callout/banner component pattern from the design system.
3. If a simulation is followed immediately by an ImageSection or a calculation with responseMode 'image', remove the vertical gap between them (treat as a visual pair). The section component itself should not change -- handle this with a CSS selector or a layout wrapper in the parent that renders sections.

Rules:
- No em dashes in prose or comments
- Do not change PDF rendering or the signature envelope -- image capture already handled by C-A infrastructure
- captureHint defaults to false / undefined (no change to existing lab configs)
```

---

### S-B: PhET-iO Native Snapshot

**Goal:** Replace the manual screenshot workflow with PhET-iO's native `screenshot` API endpoint from the Hydrogen feature set, so a single button click in LabFrame captures the current sim state as a PNG without any OS-level interaction.

**Prerequisites:**

- Active PhET-iO evaluative license ($10,000/year, contact phet-io@colorado.edu). Do not begin implementation until the license is confirmed and the PhET-iO sim URLs (versioned, served from PhET's CDN) are available.
- PhET-iO sims are served from a different URL pattern than the open CC-BY sims currently used. The `SimulationSchema.url` field will point to PhET-iO-served versions.

**Architecture:**

- PhET-iO communication uses `postMessage` between LabFrame and the sim iframe. LabFrame already has a parent-frame messaging allow-list (SPEC.md binding decision 5); the inverse (LabFrame -> sim iframe) will use `iframeEl.contentWindow.postMessage(message, phetioOrigin)` where `phetioOrigin` is the exact PhET-iO CDN origin (not `'*'`).
- Screenshot API call (from PhET-iO "Hydrogen" feature set):
  ```js
  iframeEl.contentWindow.postMessage({ id: 'screenshot' }, phetioOrigin);
  ```
  The sim responds with a `message` event carrying `{ id: 'screenshot', png: '<base64 PNG>' }`.
- On receipt: decode the base64 PNG, store as a blob in IndexedDB using the same key scheme as `ImageSection`, update the relevant `fieldId` answer, and render the thumbnail in the capture section.

**Schema changes:**

- Add `phetio: z.boolean().optional()` to `SimulationSchema` to flag sims using the PhET-iO API (separate from the `captureHint` flag from S-A).
- A sim with `phetio: true` must have a same-origin-postMessage-compatible URL. Validate this at lab-config load time (warn in dev, silent in prod).

**Capture button:**

- Render a "Capture Sim" button below or overlaid on the sim iframe (only when `phetio: true`). On click: send the screenshot message, await response, store blob, update UI. Show a spinner during the roundtrip. Timeout after 5 seconds with a user-visible error that falls back to the S-A manual workflow.

**Files to read before starting:**

- `src/domain/schema/lab.ts` -- SimulationSchema
- The sim iframe render component (from S-A work)
- `src/domain/store/` -- IndexedDB blob storage helpers (from C-A work)
- SPEC.md binding decision 5 (parent-frame messaging allow-list) -- the postMessage model to follow

**Acceptance:** On a lab using a PhET-iO sim URL with `phetio: true`, clicking "Capture Sim" sends the screenshot message and the resulting PNG appears in the linked upload slot and is included in the exported PDF.

---

**Agent handoff -- S-B:**

```
You are implementing Phase S-B of the LabFrame PhET-iO integration spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md). Phases S-A (guided upload) and C-A (image blob storage) are complete. A PhET-iO evaluative license is active.

Goal: use PhET-iO's native screenshot postMessage API to capture the sim state as a PNG with a single button click.

Read first:
1. src/domain/schema/lab.ts -- SimulationSchema (line 27), understand existing URL and allow fields
2. The sim iframe component from S-A
3. src/domain/store/ -- IndexedDB blob helpers from C-A
4. docs/SPEC.md section on binding decision 5 (postMessage allow-list pattern)

Tasks:
1. Add phetio: z.boolean().optional() to SimulationSchema
2. When phetio is true, render a "Capture Sim" button below the iframe
3. On click:
   a. Send { id: 'screenshot' } via iframeEl.contentWindow.postMessage(msg, phetioOrigin) where phetioOrigin is the PhET-iO CDN origin (a constant, NOT '*')
   b. Listen for window message event with { id: 'screenshot', png: '<base64>' }
   c. Validate the event.origin matches phetioOrigin before processing
   d. Decode base64 PNG to a Blob, store in IndexedDB with the same key scheme as image blobs from C-A
   e. Update the answer for the linked fieldId (the ImageSection or responseMode:'image' calculation immediately following the sim)
   f. Show spinner during roundtrip; timeout after 5000ms with fallback to S-A manual instructions
4. In dev mode only: log a warning if a sim has phetio: true but its URL origin does not match phetioOrigin

Rules:
- postMessage target origin must NEVER be '*' -- use the exact PhET-iO origin string
- No em dashes in prose or comments
- The fallback (S-A manual instructions) must remain functional when the capture fails
```

---

### S-C: PhET-iO Engagement Metrics

**Goal:** Use PhET-iO's event-listening API to capture student engagement data (time-on-sim, interaction events, state at submission) and store it in the canonical envelope, making it available to graders and researchers without any server-side storage.

**Scope:**

- This phase is intentionally narrow: capture data, store locally, include in the signed PDF artifact. No server, no analytics pipeline, no real-time dashboard.
- Event types to capture (from PhET-iO Hydrogen feature set): sim launch time, first-interaction time, total interaction count (bucketed by element), state at the moment the student clicks "Export PDF". Do not capture raw event streams (too large for local storage).
- Storage: add a `phETioMeta` field to the canonical `LabAnswers` envelope. Type: `Record<simId, { launchTime: number, firstInteractionMs: number, interactionCount: number, finalState: unknown }>`. The `finalState` is the PhET-iO saved-state JSON blob for the sim at export time.
- The `finalState` is stored as-is in the envelope; it is signed along with the rest of the answer payload. Graders or researchers with the PhET-iO integration can load it back into the sim for replay.
- PDF rendering: add a "Simulation Engagement" appendix section to the PDF (at the end, before the signature block) that renders a human-readable summary of the metrics. Raw state JSON is not rendered (it is only in the embedded `lab.json` attachment).

**PhET-iO state API calls (Hydrogen feature set):**

- Save state: `postMessage({ id: 'getState' }, phetioOrigin)` -> response `{ id: 'state', state: {...} }`
- Listen for interactions: `postMessage({ id: 'startEventStream' }, phetioOrigin)` -> repeated `{ id: 'event', phetioID: '...', event: '...' }` messages

**Privacy note:** The `finalState` blob may contain sim-specific pedagogical parameter values set by the student (e.g., angle of incidence in Snell's Law). It does not contain any personally identifying information beyond what is already in the envelope.

**Files to read before starting:**

- `src/domain/schema/` -- the canonical `LabAnswers` envelope type
- S-B implementation (pheTio postMessage pattern and origin constant)
- `src/pdf/` -- PDF renderer, specifically the signature block and appendix pattern

**Acceptance:** After a student session with a PhET-iO sim, the exported PDF contains a "Simulation Engagement" appendix with launch time, first interaction, and interaction count. The embedded `lab.json` contains `phETioMeta` with the final sim state. The HMAC signature covers the metrics.

---

**Agent handoff -- S-C:**

```
You are implementing Phase S-C of the LabFrame PhET-iO engagement metrics spec (docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md). Phase S-B (native screenshot capture) is complete. The PhET-iO postMessage pattern, origin constant, and iframe ref are established in the S-B code.

Goal: capture engagement metrics via PhET-iO's event stream and state APIs, store them in the canonical envelope, and render a summary in the exported PDF.

Read first:
1. src/domain/schema/ -- find the LabAnswers or canonical envelope type definition
2. The S-B sim component -- understand the existing postMessage infrastructure and phetioOrigin constant
3. src/pdf/ -- find where the PDF is assembled; locate the signature block to know where to insert an appendix

Tasks:
1. Schema: add phETioMeta?: Record<string, PhETioSimMeta> to the canonical LabAnswers type where:
   PhETioSimMeta = { launchTimeMs: number, firstInteractionMs: number, interactionCount: number, finalState: unknown }

2. In the sim component (from S-B):
   a. On iframe load: record launchTimeMs = Date.now(), send { id: 'startEventStream' } postMessage
   b. On each incoming event message: increment interactionCount, record firstInteractionMs on the first event
   c. Store running metrics in React state or a ref

3. On PDF export (hook into the existing export action):
   a. Send { id: 'getState' } to each active PhET-iO sim iframe
   b. Await response { id: 'state', state: {...} } (5s timeout, skip on timeout -- do not block export)
   c. Merge metrics + finalState into phETioMeta and include in the canonical envelope payload before signing

4. PDF appendix: after the last section and before the signature block, add a "Simulation Engagement" section with a simple table: Sim title | Time to first interaction | Total interactions | State captured (yes/no). Do not render the raw state JSON in the PDF.

Rules:
- postMessage target origin must NEVER be '*'
- phETioMeta is optional -- labs without phetio: true sims have no metrics and that is fine
- Do not block PDF export on state fetch; use Promise.race with a 5s timeout
- No em dashes in prose or comments
- Privacy: do not add any PII to the metrics; sim state is pedagogical parameter values only
```

---

## Track P: PDF Report Quality

A review of an exported draft (Coulomb's Law) surfaced rendering and density problems in the signed PDF. This track collects the fixes. It is presentation only: **none of these phases may change the canonical signed envelope** (`buildAnswers`) or the HMAC payload. The envelope binds answers (fields, tables, images, draw strokes, selections); it does not include instructions content or PDF layout, so hiding or compacting sections in the PDF is purely a rendering concern and must leave `buildAnswers` / `canonicalize` / `sign` untouched.

### P-A: Math glyph rendering (DONE, commit `3d03d21`)

Embedded DejaVu Sans (regular/bold/oblique) and set it as the document font so the unicode the math converter emits (subscripts, superscripts, operators, Greek) renders instead of showing missing/wrong glyphs from the standard-14 fonts. Math spans inherit the document font instead of Courier.

### P-B: Section titles and prompts (DONE, commit `b76bf2e`)

Replaced raw schema `kind` strings with human titles, render each section's prompt above its answer, dropped the redundant per-block "Instructions" heading, and routed labels / table headers / prompts through the inline math converter (`mathToInline`). Expanded `latexToUnicode` (commit `37dcc8a`) to strip wrappers and convert super/subscripts before fractions.

### P-C: Drop background theory and compact unanswered responses (DONE)

**Goal:** stop the PDF from rendering pure background/theory content and a full block per blank response, while keeping the grader aware of what was skipped.

**Schema (`src/domain/schema/lab.ts`, `SectionMetadataSchema`):**

- Add `pdfHidden: z.boolean().optional()`. A section with `pdfHidden: true` is omitted from the PDF body and the Process Record. It still renders in the on-screen worksheet and does not affect the envelope.

**Mark the content:** set `pdfHidden: true` on instructions sections that are purely expository background / theory / reference and are not needed to interpret a student's answer: headings like "Background ...", "A note on ...", standalone derivations, and reference-only tables. **Keep** the integrity agreement, procedural "Step N" instructions, and concept-check framing that gives context to an adjacent response. Apply across the enabled labs; authors can re-tune the flags later.

**Response compaction (`src/services/pdf/Document.tsx`):** classify each field-owning section (objective, measurement, multiMeasurement, calculation, concept, image, dataTable) as **answered** (has any student content: non-empty field text, an uploaded image, a non-empty drawing page, or any filled table cell) or **unanswered**.

- Answered sections render fully (title, prompt, answer) as today.
- Unanswered field-owning sections are **not** rendered individually. Instead render one prominent block, e.g. "Unanswered sections (N): <human titles>", so the grader sees exactly what was left blank without paging through empty `-` blocks. Instructions and plots are not student-answerable and never appear in this list.

**Acceptance:** a draft where the student answered two of ten calculations shows those two in full and a single "Unanswered sections" block listing the other eight; background/theory instructions blocks marked `pdfHidden` do not appear in the PDF; the on-screen worksheet and the signed envelope are unchanged.

### P-D: Process Record densification (DONE)

**Goal:** replace the one-section-per-block, five-lines-each Process Record (which ran ~6 pages, listing field-less sections as zeros) with a dense, accountable table.

**Scope (`src/services/pdf/Document.tsx`, plus a duration helper):**

- Render a **compact table**: one row per field-owning section that has **recorded activity** (active time, keystrokes, or pastes > 0). Columns: Section (human title) | Active time | Keystrokes | Deletes | Pastes (clipboard / autocomplete / IME, e.g. `2 / 0 / 1`). Include a **totals row**.
- Sections with **no recorded activity** are collapsed into a single prominent line: "No recorded activity: <human titles>", so nothing is silently dropped. (A draw- or image-answered section legitimately has zero typing activity and will appear here; that is correct.)
- Field-less sections (instructions, plot) and `pdfHidden` sections do not appear in the Process Record at all.
- **Active time is formatted as H/M/S**, not milliseconds: `45s`, `2m 05s`, `1h 03m 12s` (omit higher zero units, zero-pad lower ones). Add a `formatDuration(ms)` helper (e.g. `src/services/pdf/formatDuration.ts` or alongside `pointsFormatting`) with unit tests.

**Acceptance:** the Process Record is a single dense table plus a totals row and a "No recorded activity" summary line; active times read as `1h 03m 12s` style; field-less and `pdfHidden` sections are absent; total page count drops substantially.

### P-E: Layout and length (DONE)

**Goal:** cut wasted vertical space and overall page count.

**Scope (`src/services/pdf/Document.tsx`):**

- **Empty plots:** when a plot has no data points, render a compact one-line placeholder ("<plot title>: no data plotted") instead of the full empty SVG axes box.
- **Drawings:** shrink the embedded drawing image (a dedicated `drawImage` style, max height roughly half a page) and keep each page block whole (`wrap={false}`) with its "Page N of M" label and SHA caption grouped with the image, so about two drawing pages fit on one PDF page. Uploaded photos may keep a larger cap.
- General: verify the combined effect of P-C / P-D / P-E meaningfully reduces page count on the Coulomb draft (the review sample was 15-16 pages mostly empty).

**Acceptance:** an all-empty draft renders in far fewer pages; empty plots are one line each; two drawing pages share a PDF page; plots with data and answered drawings are unaffected.

### P-F: True typeset math (DEFERRED)

The current converter produces a unicode approximation (`(|Q₁ Q₂|)/(d²)`), not real 2D math (stacked fractions, radicals, integrals). Rendering genuine typeset math in the PDF would require running the existing on-screen KaTeX path to MathML/SVG (or an image) and embedding that per math span. This is a separate, larger project; deferred until prioritized. Until then, the unicode approximation is the accepted output.

---

**Agent handoff -- P-C / P-D / P-E:**

```
You are implementing Phases P-C, P-D, and P-E of Track P (PDF Report Quality) in docs/specs/TABLET_RICHCALC_PHETIO_SPEC.md. P-A (font embedding) and P-B (titles/prompts) are already done.

HARD CONSTRAINT: this is presentation only. Do NOT change the signed envelope. Do not touch src/services/integrity/buildAnswers.ts, canonicalize.ts, or sign.ts, and do not change what goes into the canonical payload. All changes are in the PDF renderer and the lab content flags.

Read first:
1. src/services/pdf/Document.tsx -- the section renderer, calculation/draw/image branches, and the Process Record page
2. src/domain/schema/lab.ts -- SectionMetadataSchema (shared optional fields) and the section variants
3. src/domain/pointsFormatting.ts -- pattern for a small formatting helper + its tests
4. The exported review notes in this spec's Track P section

P-C (drop theory + compact unanswered):
- Add pdfHidden?: z.boolean().optional() to SectionMetadataSchema. Skip pdfHidden sections in the PDF body and Process Record. They still render on screen and must not affect the envelope.
- In the labs (src/content/labs/**), set pdfHidden: true on instructions blocks that are purely background/theory/reference (headings like "Background ...", "A note on ...", derivations, reference-only tables). KEEP the integrity agreement, "Step N" procedural instructions, and concept-check framing.
- Classify field-owning sections (objective, measurement, multiMeasurement, calculation, concept, image, dataTable) as answered (non-empty field text / uploaded image / non-empty drawing page / any filled table cell) vs unanswered. Render answered sections fully; collapse all unanswered field-owning sections into ONE prominent block "Unanswered sections (N): <human titles>". Instructions and plots never appear in that list.

P-D (Process Record):
- Replace the per-section blocks with a dense table: one row per field-owning section WITH recorded activity (activeMs, keystrokes, or any paste > 0). Columns: Section | Active time | Keystrokes | Deletes | Pastes (clipboard / autocomplete / IME). Add a totals row.
- Collapse zero-activity field-owning sections into one line: "No recorded activity: <human titles>". Omit field-less (instructions, plot) and pdfHidden sections entirely.
- Format active time as H/M/S via a new formatDuration(ms) helper with unit tests: 45s, 2m 05s, 1h 03m 12s (omit higher zero units, zero-pad lower ones).
- Reuse the human section titles from P-B (factor the SECTION_TITLES map / a sectionTitle(section) helper so the body and the record share it).

P-E (layout/length):
- Empty plot (no data points): render a one-line placeholder instead of the empty SVG axes.
- Drawings: add a drawImage style capped near half a page; keep each drawing page block whole (wrap={false}) with its "Page N of M" label and SHA caption grouped with the image so ~2 pages fit per PDF page. Photos may keep a larger cap.

Verify:
- npm run typecheck (tsc -b), npm run lint, npm test all green. Update the renderPdf text-form snapshot tests as needed.
- react-pdf does not fully rasterize under jsdom; the existing render tests assert at the React-tree/text level. To eyeball real output, node-render a lab with @react-pdf/renderer (tsx, register the DejaVu fonts from src/services/pdf/fonts by absolute path) and rasterize with a PDF tool.

Rules:
- No em dashes in prose or comments.
- Do not change the on-screen worksheet behavior or the signed envelope.
- Keep section-title and duration formatting in small, unit-tested helpers.
```

---

## Phase dependency map

```
T-A (layout CSS) --> T-B (touch audit)

C-A (image upload in calc) --> C-B (free draw canvas) --> C-C (student-selectable response mode)

S-A (guided screenshot)
    |
    v
S-B (PhET-iO native capture)  <-- requires C-A (blob storage)
    |
    v
S-C (engagement metrics)

P-A (font embed) --> P-B (titles/prompts) --> P-C (drop theory + compact) / P-D (process record) / P-E (layout)
P-F (true typeset math) deferred
```

Track T and Track C are fully independent of each other and of Track S.
Track S phases must execute in order. S-B requires the blob storage helpers from C-A.
Track P is independent of T / C / S. P-C, P-D, and P-E build on P-A/P-B (done) and may be implemented together.

---

## Open decisions

| #   | Decision                                         | Notes                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | PhET-iO license timing                           | S-B and S-C cannot start until the evaluative license is signed. Contact phet-io@colorado.edu.                                                                                                                                                |
| 2   | Which sims get phetio: true first                | Snell's Law (Bending Light) is the obvious first candidate as it is already embedded. Confirm PhET-iO availability of that specific sim.                                                                                                      |
| 3   | Canvas stroke storage ceiling                    | If a student draws many strokes, FieldValue.text (localStorage) may grow large. Monitor and add IndexedDB overflow if needed after C-B ships.                                                                                                 |
| 4   | phETioMeta in PDF appendix                       | Decide with course instructors whether graders want this data visible or only in the embedded JSON. The spec defaults to a human-readable summary; make it opt-in per lab if instructors prefer.                                              |
| 5   | Retaining non-active answers (C-C)               | C-C keeps every mode's entered answer in the envelope even after the student switches modes; only the active mode renders in the PDF body. Confirm graders want inactive answers retained for process tracking rather than cleared on switch. |
| 6   | Default response mode (C-C)                      | C-C defaults a selectable section to the first `responseModes` entry. Confirm authors order the array intentionally (e.g. put `text` first so typed answers are the default).                                                                 |
| 7   | Which instructions are "background theory" (P-C) | The agent marks `pdfHidden: true` on expository background/theory/reference instructions, keeping integrity + procedural steps. The author reviews the resulting flags per lab and re-tunes; the rule is a judgment call, not exhaustive.     |
| 8   | Compacting data tables (P-C)                     | An empty data table is a field-owning section and would land in the "Unanswered sections" summary. Confirm graders are fine with an unfilled table collapsing into that summary rather than printing an empty grid.                           |
| 9   | True typeset math (P-F)                          | The unicode approximation is the accepted PDF math output for now. Revisit P-F (KaTeX to SVG/image) only when typeset-quality fractions/radicals are worth the added renderer complexity.                                                     |
