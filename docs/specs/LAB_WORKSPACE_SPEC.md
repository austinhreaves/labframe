# Lab Workspace Redesign Spec

**Status:** Not started. Spec only.
**Created:** 2026-06-30
**Source:** `LabFrame Lab.dc.html` mock + the lab-workspace handoff (the seven passes).
**Related:** `docs/specs/UI_REDESIGN_BRIEF.md` already earmarks lab-page work as its "Phase 3"
(worksheet prose 14px to 16px, the save-indicator check-draw, the TOC focus ring). This spec is
the detailed structural follow-on; keep the two consistent. Start-screen and `/sims` work live in
`docs/specs/START_SCREEN_SPEC.md` and `docs/specs/SIMS_SPEC.md`.

---

## Overview

The lab workspace is where a student spends three hours: a PhET simulation on one side, the
worksheet on the other. The handoff redesigns it as seven self-contained passes, each a
standalone decision that can be built or reverted independently. This spec records each pass
against what the code does today, because a large part of the workspace already exists and the
mock was drawn against an older build in places.

| Pass | Goal                                             | Today                                |
| ---- | ------------------------------------------------ | ------------------------------------ |
| 1    | Answerable cards visually distinct from teaching | Partially (per-kind section views)   |
| 2    | Point pills + rendered callouts                  | Mostly built (data + renderers)      |
| 3    | Slim sticky section header (~36px)               | New (depends on Pass 5)              |
| 4    | One consolidated 52px toolbar                    | New (two stacked rows today)         |
| 5    | Sectioned model: each part owns its simulation   | New (flat sections + sim picker)     |
| 6    | Two nav primitives, no persistent footer         | New (TOC only)                       |
| 7    | View settings persisted per student              | Partially (split/swap/theme)         |
| --   | Answer persistence + process record              | Built (autosave + paste attribution) |

**Non-goals:**

- Any server-side state, accounts, or login (ADR-0002 is absolute).
- Changing the integrity envelope, signing, or the process-record capture itself; this pass
  reorganizes the UI around them, it does not alter what gets signed.
- Phone-sized (< 600px) layout, consistent with the redesign brief.

**Conventions reminder (from CLAUDE.md):** no em dashes anywhere; the iframe stability
invariant (no animation on the simulation iframe or its layout ancestors) is absolute; nothing
animates on a keystroke path; verify types with `npm run typecheck` (tsc -b); run `npm run ci`
and `npm run test:e2e` for this UI / layout / routing change.

---

## Current state (what is being redesigned)

The workspace is `src/ui/LabPage.tsx`. What already exists, so the passes refine rather than
build from zero:

- **Two-pane shell** with a draggable split (`splitFraction` + `src/ui/layout/SplitHandle.tsx`),
  a real PhET `<iframe>` (`StableSimulationFrame`), and a worksheet pane that renders
  `lab.sections.map(...)` as one continuous scroll.
- **Tabs layout** and **swap sides** already exist (`src/ui/layout/LayoutToggle.tsx`; the
  `layout`, `tab`, and `side` URL search params; `simSide` in the store).
- **Theme** select (System / Light / Dark) persisted through `src/ui/theme.ts`.
- **Autosave** with a debounced persistence middleware; the header shows
  "Saved HH:MM in this browser" from `status.lastSavedAt`.
- **A simulation picker** dropdown shown only when a lab has more than one simulation.
- **Per-section point captions** (`src/ui/sections/SectionPointsCaption.tsx`, fed by the
  optional `points` already on every section schema in `src/domain/schema/lab.ts`).
- **Rendered callouts** (`src/ui/primitives/MarkdownBlock.tsx` parses
  `[!NOTE|TIP|WARNING|IMPORTANT|CAUTION]` blockquotes into styled `<aside>`s).
- **Process record:** paste attribution and edit-timing capture already feed the signed PDF
  (`src/services/pdf/attributePastes.ts`, `src/services/pdf/formatDuration.ts`,
  `src/ui/IntegrityAgreement.tsx`, the store, and `src/services/pdf/Document.tsx`).
- A two-row header (`.lab-header-top` + `.lab-header-bottom`) holding the wordmark, theme,
  About, Take the tour, layout toggle, swap, `TableOfContents`, `ProgressBar`, student / TA
  inputs, the save status, Start fresh, and Save draft.

---

## Pass 1: Answerable blocks vs teaching content

**Goal:** make "do this" (instruction) and "answer this" (a gradable field) unmistakable.

- **Teaching / instructions** stay low-emphasis: prose, numbered mechanism rows, light step
  badges. This is the `instructions` section kind (`InstructionsSectionView`) and the optional
  `preamble` on `concept` / `calculation` sections.
- **Answerable blocks** become distinct cards: 1px border, a 3px indigo left rule, a faint
  indigo fill, a `YOUR ANSWER` eyebrow above the field, and a status tag that flips
  **"Not yet" to "Answered"** (grey to green) as the student types.
- The procedure step is a light instruction row; the answer card sits below it, indented.

**Where:** the answerable section views (`concept`, `calculation`, `objective`, `measurement`,
`multiMeasurement`, `dataTable`, `plot`, `image`) under `src/ui/sections/`, plus styling in
`src/main.css`. The answer-card chrome (eyebrow + status tag) is best added once, around the
shared `Field` primitive or a small wrapper, rather than per view.

**Reuse:** the "answered" predicate already exists for `src/ui/ProgressBar.tsx` /
`src/ui/layout/TableOfContents.tsx` (they count answered sections). Factor that predicate into a
shared helper and drive the status tag from it so the tag, the progress segments (Pass 4), and
the sticky-header count (Pass 3) all agree.

---

## Pass 2: Point values and the NOTE callout

**Goal:** explicit point pills on gradable questions; markdown admonitions render as callouts.

- **Point pills:** the data exists (`points` on every section) and renders today via
  `SectionPointsCaption`. This pass restyles it to an inline indigo pill (`1 pt`, `0.5 pt`)
  placed with the prompt or heading, and confirms every answerable view shows it. This is a
  styling and placement change, not new data.
- **Callouts:** already implemented. `MarkdownBlock` turns
  `> [!NOTE]` (and TIP / WARNING / IMPORTANT / CAUTION) into a tagged, tinted panel; the
  `NOTE` variant is the green chip + green-tinted panel the mock shows. The mock's "leaked
  literal `[!NOTE]` token" reflects an older build and is already fixed. The only work here is
  to verify no answerable view renders authored markdown through a path that bypasses
  `MarkdownBlock`, and that the callout token set matches what lab content uses.

**Where:** `src/ui/sections/SectionPointsCaption.tsx`, `src/main.css`,
`src/ui/primitives/MarkdownBlock.tsx` (verification only).

---

## Pass 3: Slim sticky section header

**Goal:** a persistent single ~36px row at the top of the worksheet pane.

- Left: lab title (`Charge Buildup`) + the active part and sim name (`Part 1A - John
Travoltage`).
- Right: the per-section answered count (`2/3 answered`) + the minimal nav arrows from Pass 6.
- Small primitives only: no large progress pill, no stacked rows.

**Depends on Pass 5:** "active part" and "sim name" only exist once the lab is modeled as parts.
Until then the header can show the lab title and a whole-lab answered count, but the part / sim
binding is the point of the row.

**Where:** new element at the top of the `.worksheet-pane` in `LabPage.tsx`, styled in
`main.css`. The answered count reuses the Pass 1 shared predicate.

---

## Pass 4: Consolidated toolbar

**Goal:** merge the two stacked top bars into one 52px toolbar, grouped left to right with thin
dividers, reclaiming about 48px of height.

- **Left (context):** `LabFrame` wordmark, `< PHY 114` back link, `Sections` menu (the current
  `TableOfContents` as a dropdown), the section-progress segments, and the active part label.
- **Right (identity + settings + actions):** Student / TA inputs, autosave status (short
  `Saved 22:47`, full timestamp on hover), Theme (icon), **Text size Aa S/M/L** (Pass 7),
  layout **Side / Tabs**, **Swap** (icon), `Start fresh`, `Save draft`, and a `...` overflow
  that folds About and Take the tour.
- Low-priority chrome collapses to icons or into the `...` overflow to hold one row.

**Where:** the `<header className="lab-header">` block in `LabPage.tsx` (today
`.lab-header-top` + `.lab-header-bottom`) and its CSS in `main.css`. This is a layout refactor
of existing controls, not new behavior, except the Text size control (Pass 7) and the overflow
menu. Keep the iframe stability invariant in mind: the toolbar height change must not animate
layout properties of the iframe's ancestors.

---

## Pass 5: Sectioned model (sim coupled to questions)

**The biggest change, and a schema change.** Today `lab.simulations` is a flat record, the
worksheet renders every section in one scroll, and the student picks a sim from a dropdown when
there is more than one. The handoff wants the lab to be a sequence of **parts**, each part
owning its simulation, so switching parts swaps the worksheet body and the left simulation
together, and the sim picker dropdown is removed (the sim follows the part).

A part also carries a narrative thread (1A John Travoltage introduces friction / conduction /
induction and foreshadows polarization, 1B Balloons tests conductor vs insulator against 1A, 1C
returns to John Travoltage to synthesize), so the coupling earns its place.

### Locked: data model

An optional `parts` grouping layer over the existing flat `sections` array. Section references
use **array index ranges** (not field IDs, since `instructions`, `dataTable`, `plot`, and
`image` sections have no `fieldId`). Labs without `parts` keep rendering as one scroll;
migration is incremental.

```ts
// Addition to LabSchema in src/domain/schema/lab.ts
const PartSchema = z.object({
  key: nonEmptyText,         // "1A" — used in ?part= URL param
  title: nonEmptyText,       // "John Travoltage" — shown in sticky header and nav
  simulationId: idSchema,    // key into lab.simulations record
  sectionRange: z.tuple([    // [startIndex, endIndexExclusive] into lab.sections
    z.number().int().nonnegative(),
    z.number().int().positive(),
  ]),
});

// In LabSchema:
parts: z.array(PartSchema).min(2).optional(),
```

Zod validation rules the lab validator must enforce (add to `src/services/verifyLab`):

1. Every `simulationId` resolves as a key in `lab.simulations`.
2. Ranges are non-overlapping, contiguous, and together cover every section index (0 to
   `sections.length - 1`).
3. Each range `[start, end]` satisfies `start < end <= sections.length`.

### Locked: active part in the URL

The active part key is stored in the `?part=` search param, consistent with `layout`, `tab`,
`side`, and `student`. Default (no param) is the first part.

```
/c/phy114/chargeBuildup?part=1A
/c/phy114/chargeBuildup?part=1B
```

Part navigation updates the param with `setSearchParams` (same pattern as layout toggle) and
resets the worksheet-pane scroll to top. Browser back/forward works naturally.

### Renderer changes in `LabPage.tsx`

- Derive `activePart` from `?part=` param, falling back to `parts[0]`.
- Render only `lab.sections.slice(activePart.sectionRange[0], activePart.sectionRange[1])`.
- Set `activeSimulationId = activePart.simulationId` (read from `lab.simulations`); remove
  the `activeSimulationId` state and the `.simulation-picker` `<Select>` dropdown.
- Pass `activePart` to Pass 3 (sticky header) and Pass 6 (nav primitives).
- For labs without `parts`, render all sections as today (no regression).

### PDF / envelope

The signed report must cover every section across all parts. `renderPDF` and
`buildAnswersFromStore` iterate `lab.sections` in full, independent of which part is active;
no change needed there. `pdfHidden` on `SectionMetadata` continues to apply per-section.

### Locked: migration scope

Only the two live PHY 114 labs receive authored `parts` in this pass:

- `src/content/labs/phy114/chargeBuildup` (reuses `phy132ChargeBuildupLab` — parts must be
  added to the PHY 132 source or a PHY-114-owned copy must be created; prefer the copy to keep
  PHY 132 separate).
- `src/content/labs/phy114/coulombsLaw.draft.lab.ts`.

All other enabled labs keep the single-scroll layout until they are individually migrated.
Run `npm run verify:lab -- chargeBuildup` and `-- coulombsLaw` after authoring parts.

This pass is the dependency for Pass 3 (active part / sim in the sticky header) and Pass 6
(part nav primitives).

---

## Pass 6: Two navigation primitives (no persistent footer)

**Goal:** replace any full-width sticky footer with two lighter pieces.

1. **Top, sticky:** a minimal `<` `>` arrow pair in the section header (Pass 3). Dims at the
   first / last part. Always reachable, costs no vertical space.
2. **Bottom, non-sticky:** a larger labeled nav at the natural end of the scroll:
   `< Part 1A` / `Part 1B - 2 of 3` / `Next: Part 1C >`, becoming a green **Finish & review**
   on the last part.

Both drive the same part navigation and **reset the worksheet scroll to top** on change.

**Where:** `LabPage.tsx` (the worksheet pane), `main.css`. Depends on Pass 5 for the part
sequence. Scroll reset targets the `.worksheet-pane` scroll container.

---

## Pass 7: View settings, persisted per student

**Goal:** all client-side view preferences persist per student in localStorage.

- **Text size** S / M / L, scaling the worksheet content (`zoom` 0.88 / 0.96 / 1.08; default M,
  intentionally a touch under 1.0). New control and new persisted value.
- **Layout** Side-by-side vs Tabs, and **Swap sides**. These work today but layout / tab live
  in URL search params only; this pass also persists the student's preference so it survives a
  fresh navigation. `simSide` and `splitFraction` are already persisted in the store.
- **Theme** System / light / dark. Already persisted via `src/ui/theme.ts`; no change beyond
  surfacing it in the consolidated toolbar.

**Where:** a small view-settings module (mirror `theme.ts`) for text size and the persisted
layout preference, read in `LabPage.tsx`; CSS variable or `zoom` on the worksheet content
wrapper for text size. Keep the URL params working (they are good for sharing / deep links);
persistence is the fallback when no param is present.

---

## Answer persistence and the process record

Largely already built; this section records it so the redesign does not re-implement it.

- **Autosave:** every answer persists to localStorage keyed by lab + field through the
  debounced middleware; the "Saved HH:MM in this browser" status already reflects it.
- **Process record:** paste / autocomplete attribution and edit timing are already captured per
  field and rendered into the signed report (`src/services/pdf/attributePastes.ts`,
  `formatDuration.ts`, `Document.tsx`, wired from the store and `IntegrityAgreement`). This stays
  local and FERPA-safe and never leaves the browser. The redesign must keep these capture paths
  intact when it restructures the section views (Pass 1) and the part model (Pass 5); do not
  detach the `Field` instrumentation when wrapping fields in answer cards.

---

## Styling and fonts

- Map the mock's dark palette, panels, borders (`rgba(255,255,255,0.06-0.10)`), and radii
  (9-16px) onto the existing tokens in `src/ui/tokens.css`. Adaptive theme, consistent with the
  start-screen decision: the dark mock is the dark-mode appearance.
- **Fonts:** Space Grotesk (`--font-display`) for the wordmark and labels, Inter (`--font-sans`)
  for body, JetBrains Mono (`--font-mono`) for sim / URL captions. Do not add IBM Plex Sans or
  IBM Plex Mono; this matches the locked start-screen decision and avoids new font dependencies.
- Minimum 44px hit targets; watch contrast on the muted greys, especially in light mode.

---

## Divergences from the handoff

- **Callouts already render;** the mock's leaked `[!NOTE]` is fixed. Pass 2 is points-pill
  styling plus verification, not a parser build.
- **Process record already exists;** the "Answer persistence" pass is reconciliation, not new
  capture infrastructure.
- **Fonts:** Inter for body and JetBrains Mono for mono, not IBM Plex Sans / Mono (locked).
- **Layout / swap / theme already exist;** Pass 7 mainly adds Text size and per-student
  persistence of the layout preference.
- **Sim picker exists today;** Pass 5 removes it in favor of part-bound simulations.

---

## Build order and dependencies

Independent and shippable on their own: Pass 1, Pass 2, Pass 4, Pass 7. Sequenced: Pass 5 (parts
model) first, then Pass 3 (header shows active part / sim) and Pass 6 (part nav) on top of it. A
sensible order:

1. Pass 2 (point pills) and Pass 1 (answer cards) - low risk, high signal, share the answered
   predicate.
2. Pass 7 (view settings) and Pass 4 (toolbar) - layout refactors, no schema change.
3. Pass 5 (parts model) - schema + renderer + validator + content migration, behind backward
   compatibility so unmigrated labs still render as one scroll.
4. Pass 3 (sticky section header) and Pass 6 (nav primitives) - built on the part model.

## Verification

- `npm run ci` and `npm run test:e2e` (navigate e2e directly to a lab route, per the repo note).
  `npm run verify:lab -- <labId>` after any schema or content change for Pass 5.
- Manually confirm in the browser, in both themes: answer cards are visually distinct with the
  Not yet / Answered tag; point pills show on every gradable question; callouts render; the
  toolbar is one row; switching parts swaps worksheet and simulation together with no picker; the
  top arrows and bottom labeled nav both move between parts and reset scroll; text size and
  layout persist across a fresh navigation; the simulation iframe never reloads or animates on a
  layout change; PDF export still includes every section across all parts with the process record
  intact.
