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

**Guiding principle: reduce extraneous cognitive load.** The student's attention should go to the
physics, not to operating the app. Wherever a step is not about the physics, streamline or
eliminate it: bind the simulation to the part so there is nothing to pick; keep questions that
need a simulation with that simulation, and route questions that do not (discussion, conclusion,
reflection) into the final review where the student already has everything in view; auto-place the
student at the next thing to do rather than making them hunt for it. When a design choice is
otherwise a toss-up, prefer the one that removes a non-physics decision.

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

- Two teaching badge styles exist in the mock and should be preserved: rounded-square badges for
  background / mechanism rows, light circular outlined badges for procedure ("do this") steps.

**Where:** the answerable section views (`concept`, `calculation`, `objective`, `measurement`,
`multiMeasurement`, `dataTable`, `plot`, `image`) under `src/ui/sections/`, plus styling in
`src/main.css`. The answer-card chrome (eyebrow + status tag) is best added once, around the
shared `Field` primitive or a small wrapper, rather than per view.

**Do not detach the `Field` instrumentation.** The prototype's answer input is a plain
`<textarea>`, but the real answer field routes through the instrumented `Field` primitive that
feeds paste attribution and edit-timing into the signed process record. Wrapping the field in an
answer card must keep `Field` as the input; rebuilding from the mock's bare textarea would
silently drop the process record from the exported PDF. This is the highest-risk regression in
this pass.

**Reuse:** the "answered" predicate exists today only as the private `sectionHasText(section,
state)` in `src/ui/ProgressBar.tsx`. `src/ui/layout/TableOfContents.tsx` does **not** compute
answered state (it only builds TOC entries and tracks the scrolled-into-view section); the
sticky-header per-part count (Pass 3) is net-new wiring, not a reuse of the TOC. Factor
`sectionHasText` out into a shared helper and drive the status tag, the progress segments
(Pass 4), and the sticky-header count (Pass 3) from it so they all agree. For per-part counts,
reuse the per-section `sectionHasText` over the part's section slice; do **not** reuse
ProgressBar's `buildSectionGroups`, which partitions sections under TOC headings (a different
grouping than parts). The predicate counts **answerable** sections only; mirror ProgressBar's
existing `isCountedSection`, which excludes both `instructions` **and** `plot` (the field-less
kinds), so a part's answered total matches today's counting behavior.

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
- Right: the per-part answered count (`2/3 answered`, over the active part's answerable sections
  only, per the Pass 1 predicate) + the minimal nav arrows from Pass 6.
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
  `TableOfContents` as a dropdown, but navigating **parts** in a parts lab, see below), the
  **part-progress segments**, and the active part label.
- **Right (identity + settings + actions):** Student / TA inputs, autosave status (short
  `Saved 22:47`, full timestamp on hover), Theme (icon), **Text size Aa S/M/L** (Pass 7),
  layout **Side / Tabs**, **Swap** (icon), `Start fresh`, `Save draft`, and a `...` overflow
  that folds About and Take the tour.

**Part-progress segments:** one segment per part (not per section). Three states, matching the
mock: filled accent when every answerable section in the part is answered, half-tone
(`rgba(99,102,232,0.45)`) when some are, faint (`rgba(255,255,255,0.09)`) when none. When the lab
has a review tail with answerable questions (the discussion / conclusion), append one more segment
for it (a "Review" segment), so a student can see questions still remain after the last part and
does not mistake finishing Part 1C for finishing the lab.

**Sections menu:** in a parts lab the `Sections` dropdown navigates parts (or groups sections
under their part), driving the same `?part=` navigation; it no longer lists raw sections that do
not correspond to the one-part-at-a-time view. Unmigrated labs keep the flat section list.

**Overflow priority (responsive):** the row holds many controls and the mock is drawn wide. When
width is tight, fold in this order (first to fold first): Take the tour and About (already in
`...`), then Text size, then Swap, then Theme, collapsing labeled toggles to icons before hiding.
Always keep visible: wordmark, active part label, student name, save status, Side / Tabs, Start
fresh, Save draft. This explicit order prevents an autonomous run from producing a row that wraps
or clips at 1280 to 1440px.

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

### What changes and what does not

The within-part scroll stays. A part is teaching plus its questions and can be long; the
worksheet pane scrolls that part's content exactly as today. What is removed is the
**all-parts-in-one-scroll**: the pane renders only the active part's sections, and the sticky
"next" primitive (Pass 6) advances Part 1A to Part 1B, swapping that part's sections **and** its
bound simulation together. The sim-to-part relationship is many-parts-to-one-sim: a lab may use
the same `simulationId` in several parts (in the simplified mock, 1A and 1C are both John
Travoltage), and that is correct, not a duplicate to collapse.

**Parts cover the sim-coupled work, not necessarily the whole lab.** Sections that need a
simulation belong to a part; trailing sections that do **not** need a simulation (the discussion,
conclusion, and reflection questions) are not assigned to any part. They are the **review tail**,
surfaced in Finish & Review (see "Submission and review flow"). This is the guiding principle in
action: a student answering a reflection question should not be parked in front of an irrelevant
simulation. The integrity accept-gate and PDF export also live in the review step, not inside any
part.

### Locked: data model

An optional `parts` grouping layer over the existing flat `sections` array. Section references
use **array index ranges** (not field IDs, since `instructions`, `dataTable`, `plot`, and
`image` sections have no `fieldId`). Labs without `parts` keep rendering as one scroll;
migration is incremental.

```ts
// Addition to LabSchema in src/domain/schema/lab.ts
const PartSchema = z.object({
  key: nonEmptyText,         // "1A", used in ?part= URL param
  title: nonEmptyText,       // "John Travoltage", shown in sticky header and nav
  simulationId: idSchema,    // key into lab.simulations record
  sectionRange: z.tuple([    // [startIndex, endIndexExclusive] into lab.sections
    z.number().int().nonnegative(),
    z.number().int().positive(),
  ]),
});

// In LabSchema:
parts: z.array(PartSchema).min(2).optional(),
```

Validation rules to enforce. There is no `src/services/verifyLab` module: lab validation is the
Zod `LabSchema` in `src/domain/schema/lab.ts` plus the deterministic script `scripts/verify-lab.ts`.
The parts rules below are cross-field, so add them as a `.superRefine` on `LabSchema` (rules 1-4,
which then run everywhere the schema runs), and add rule 5's orphan check as a `warning`-severity
finding in `scripts/verify-lab.ts` (the script already has a `warning` severity; a `superRefine`
can only fail, not warn):

1. Every `simulationId` resolves as a key in `lab.simulations`. The same `simulationId` may
   appear in more than one part (reuse across parts is allowed and expected).
2. Parts form a contiguous run starting at index 0: `parts[0]` starts at 0, and each part's
   `start` equals the previous part's `end` (non-overlapping, no gaps).
3. Each range `[start, end]` satisfies `start < end <= sections.length`.
4. The parts cover a **prefix** `[0, R)` where `R = parts[last].end`. Sections `[R,
sections.length)` are the **review tail** (the sim-less discussion / conclusion zone) and are
   allowed; the tail may be empty (parts cover everything). Sections before `R` must all belong to
   a part.
5. **Warn** (do not fail) when a `lab.simulations` entry is referenced by no part: an authored
   sim is orphaned and unreachable. (For Charge Buildup all three sims are used, so this stays
   silent; it guards future labs.)

### Locked: active part in the URL

The active part key is stored in the `?part=` search param, consistent with `layout`, `tab`,
`side`, and `student`. Default (no param) is the first part.

```
/c/phy114/chargeBuildup?part=1A
/c/phy114/chargeBuildup?part=1B
```

Part navigation updates the param with `setSearchParams` (same pattern as layout toggle) and
resets the worksheet-pane scroll to top. Browser back/forward works naturally. This URL-driven
approach is a deliberate upgrade over the prototype, which tracks the active part in local React
state (`activeSection`); do not revert to local-only state to "match the mock."

### Renderer changes in `LabPage.tsx`

- Derive `activePart` from `?part=` param, falling back to `parts[0]`. `?part=review` selects the
  review step (see "Submission and review flow").
- In a part, render only `lab.sections.slice(activePart.sectionRange[0], activePart.sectionRange[1])`.
- Set `activeSimulationId = activePart.simulationId` (read from `lab.simulations`); remove
  the `activeSimulationId` state and the `.simulation-picker` `<Select>` dropdown.
- The review tail (`lab.sections.slice(R)` where `R` is the last part's `end`) never renders
  inside a part; it renders only in the review step, alongside all earlier sections.
- Pass `activePart` to Pass 3 (sticky header) and Pass 6 (nav primitives).
- For labs without `parts`, render all sections as today (no regression).

### Locked: simulation keep-alive across parts

The active simulation must **not** unmount and remount as the student navigates parts. A PhET
sim holds its state (the circuit they wired, the charge they built up) in the iframe's runtime;
unmounting destroys it, forcing the student to set it up again every time a part revisits the
sim. The build must:

- Render **one persistent iframe per distinct `simulationId`** the lab's parts reference, not a
  single frame bound to the active part. This replaces today's `key={activeSimulationId}` remount
  in `StableSimulationFrame` (keep the `mountId` stability; render the set of activated sims and
  toggle which one shows).
- **Mount lazily, then keep alive.** Do not mount a sim's iframe until the student first reaches a
  part that uses it; once mounted, keep it mounted for the rest of the session.
- **Show the active sim, hide the others with `display:none`.** `display:none` preserves the
  iframe's document and runtime state and does not reload; it is not an unmount. Never change a
  sim iframe's React key on part navigation, layout toggle (Side / Tabs), swap, or split resize.
- **Keep-alive covers revisits, not just reuse.** Charge Buildup uses a distinct sim per part, so
  the win here is revisiting: a student who builds charge in Part 1A, moves to 1B, and returns to
  1A finds John Travoltage still charged. In labs where two parts share a `simulationId`, they
  share one live iframe, so state set up in the earlier part is present in the later one (intended,
  for example a synthesis part returning to an earlier sim). An author who instead needs a fresh,
  independent instance for a later part gives it a distinct `simulationId` pointing at the same
  URL.
- **Caveat:** prefer `display:none`. If a specific PhET sim drops its WebGL / canvas context while
  hidden, fall back to keeping that sim in layout but visually hidden (off-screen / absolute) so
  the context survives. Validate during the Charge Buildup migration: charge John Travoltage in
  Part 1A, navigate away to 1B, return to 1A, and the charge must still be there.
- Memory: a handful of mounted PhET iframes (2 to 3 distinct sims per lab) is fine; the count is
  bounded by distinct sims, not parts.

### PDF / envelope

The signed report must cover every section, including the parts and the review tail. `renderPDF`
and `buildAnswersFromStore` iterate `lab.sections` in full, independent of which part is active
and independent of the parts grouping; no change needed there. `pdfHidden` on `SectionMetadata`
continues to apply per-section.

### Locked: migration scope

Only the two live PHY 114 labs receive authored `parts` in this pass:

- `src/content/labs/phy114/chargeBuildup` (reuses `phy132ChargeBuildupLab`; parts must be
  added to the PHY 132 source or a PHY-114-owned copy must be created; prefer the copy to keep
  PHY 132 separate).
- `src/content/labs/phy114/coulombsLaw.draft.lab.ts`.

All other enabled labs keep the single-scroll layout until they are individually migrated.
Run `npm run verify:lab -- chargeBuildup` and `-- coulombsLaw` after authoring parts.

**The mock is illustrative, not literal.** The prototype shows a simplified Charge Buildup of 3
parts and 8 free-text questions using 2 simulations. The real lab has **25 sections** (19
`concept`, 5 `instructions`, 1 `objective`) and **3 simulations** (`johnTravoltage`, `balloons`,
`twoConductorInduction`), one per part. Author part `sectionRange`s over the lab's actual 25
sections (teaching plus answerable together), not the mock's 8 questions.

#### Worked example: Charge Buildup parts

The lab is already part-labeled (`### Part 1A / 1B / 1C` in the concept preambles) and delivers
just-in-time theory before each part (the lab's own comment: charging mechanisms before 1A,
conservation of charge before 1B, polarization vs induction before 1C), so each part's
background `instructions` block leads its part.

```ts
parts: [
  { key: '1A', title: 'John Travoltage', simulationId: 'johnTravoltage', sectionRange: [0, 7] },
  { key: '1B', title: 'Balloons and Static Electricity', simulationId: 'balloons', sectionRange: [7, 14] },
  { key: '1C', title: 'Induction in Conductors', simulationId: 'twoConductorInduction', sectionRange: [14, 21] },
],
// sections [21, 25) are the review tail (Discussion and Conclusion), not assigned to a part.
```

Index map (parts cover the prefix `[0, 21)`; `[21, 25)` is the review tail):

- **Part 1A `[0, 7)`:** integrity blurb (0), objective "Explain the goal" (1), Background: charge
  imbalances + NOTE (2), the three John Travoltage procedure-plus-observation concepts (3 to 5),
  the charging-type question (6).
- **Part 1B `[7, 14)`:** Background: conservation of charge (7), the three balloon
  procedure-plus-observation concepts (8 to 10), the three balloon concept-check questions
  (11 to 13).
- **Part 1C `[14, 21)`:** Background: polarization vs induction (14), the two two-conductor
  procedure concepts (15 to 16), and the four induction and synthesis questions (17 to 20,
  including the cross-lab mechanism summary).
- **Review tail `[21, 25)`:** the Discussion and Conclusion heading (21) and the three conclusion
  questions (22 to 24). These need no simulation, so they surface in Finish & Review rather than a
  part. The flow is 1A, 1B, 1C, then Finish & Review.

Migration notes:

- **No orphaned sims.** All three simulations map to a part. (Resolves the earlier
  `twoConductorInduction` question: the real lab uses it in Part 1C.)
- **The conclusion is the review tail, not a part.** This is the streamlined resolution of the
  earlier judgment call: instead of folding the sim-less discussion into Part 1C behind the
  two-conductor sim, it lives in Finish & Review where the student sees all their work in one view.
- **Boundary nudge.** Part 1C ends at the explicit "Discussion and Conclusion" heading (21). The
  cross-lab mechanism-summary question (20) is kept as the cap of 1C; an author could instead push
  it into the review tail (start the tail at 20). This is the only soft line in the mapping.
- **Rewrite the picker references.** Three preambles say "Select X from the simulation picker"
  (sections 3, 8, 15). Pass 5 removes the picker and binds the sim to the part, so rewrite those
  lines (for example "The simulation for this part is John Travoltage.") or delete the sentence.
- **Author on a PHY-114-owned copy** of the lab (per migration scope), leaving the shared PHY 132
  object untouched.

This pass is the dependency for Pass 3 (active part / sim in the sticky header) and Pass 6
(part nav primitives).

---

## Pass 6: Two navigation primitives (no persistent footer)

**Goal:** replace any full-width sticky footer with two lighter pieces.

1. **Top, sticky:** a minimal `<` `>` arrow pair in the section header (Pass 3). Dims at the
   first / last part. Always reachable, costs no vertical space.
2. **Bottom, non-sticky:** a larger labeled nav at the natural end of the part's scroll:
   `< Part 1A` / `Part 1B - 2 of 3` / `Next: Part 1C >`, becoming a green **Finish & review**
   on the last part. Finish & review enters the review step (see "Submission and review flow"),
   it does not advance to another part.

Both drive the same part navigation and **reset the worksheet scroll to top** on change.

**Where:** `LabPage.tsx` (the worksheet pane), `main.css`. Depends on Pass 5 for the part
sequence. Scroll reset targets the `.worksheet-pane` scroll container.

---

## Submission and review flow (Finish & review)

The parts model removes the single scroll where the integrity accept-gate and export button live
today, so the submission flow gets an explicit home. This is the resolution of the two functional
gaps the prototype left open (it shows an informational integrity blurb but no export screen).

- **Informational integrity blurb at entry.** A passive, informational integrity card appears
  once at the top of the first part (the amber "Your report includes a process record..." card in
  the mock). It is copy only, not the accept control.
- **Finish & review is a review step, not a part.** Reached by the green Finish & review button on
  the last part. Model it as a terminal state in the same `?part=` scheme, e.g. `?part=review`, so
  it shares navigation and back/forward with the parts.
- **Review renders everything, worksheet-only, in one scroll.** The review step forces the
  worksheet-only view (the existing `layout=tabs` / `tab=worksheet` mode, simulation hidden) and
  renders **every** section in order: all parts' sections followed by the review-tail discussion
  and conclusion sections. This is exactly today's full `lab.sections.map(...)`. Every answer field
  is live and editable here (it is the full worksheet); the only thing missing versus a part is the
  simulation. The kept-alive sim iframes stay mounted but hidden (the whole sim pane is hidden), so
  returning to a part preserves every sim's state.
- **Auto-place the student at the next thing to do.** On entering review, auto-scroll to the start
  of the review tail (the "Discussion and Conclusion" heading), so the student lands on the
  questions that remain rather than at the top of a long page. They can scroll up to review any
  earlier part's work, edit it in place, or proceed down through the discussion questions to the
  export. If the lab has no review tail (parts cover everything), scroll to the integrity / export
  block instead.
- **Accept and export at the end of review.** The existing `IntegrityAgreement` accept control,
  the `validateStudentInfoForPdf` preflight, and the signed `exportPdf` flow render at the bottom
  of the review step, after the discussion questions, reused unchanged. `Save draft` remains
  available throughout.
- **Back to editing.** Provide a way back from review to the parts (a "Back to Part N" affordance
  or the top arrows / Sections menu), so a student who wants the simulation again can return to the
  relevant part. Editing answers, though, can be done inline in review without leaving.

**Where:** `LabPage.tsx`. The review step is a thin branch: when `?part=review`, render the
worksheet-only layout over all sections plus the existing `IntegrityAgreement` block, instead of
the active-part slice. No change to the export, signing, or envelope code.

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

The draggable split (`SplitHandle` + persisted `splitFraction`) is **retained**. The prototype
hardcodes a fixed 50/50 with no resize handle; that is a mock simplification, not a directive to
remove the resize affordance.

**Where:** a small view-settings module (mirror `theme.ts`) for text size and the persisted
layout preference, read in `LabPage.tsx`; `zoom` (or a font-size CSS variable) on the worksheet
content wrapper for text size. Keep the URL params working (they are good for sharing / deep
links); persistence is the fallback when no param is present. The `zoom` must stay scoped to the
worksheet content wrapper and never an ancestor of the simulation iframe (iframe stability
invariant); it reflows worksheet layout, so any pixel-position e2e assertion on the worksheet
must account for the active scale. `zoom` is broadly supported (Firefox 126+).

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
4. Pass 3 (sticky section header), Pass 6 (nav primitives), and the Submission and review flow -
   built on the part model; the review step reuses the existing full-worksheet render plus
   `IntegrityAgreement` and export.

## Verification

- `npm run ci` and `npm run test:e2e` (navigate e2e directly to a lab route, per the repo note).
  `npm run verify:lab -- <labId>` after any schema or content change for Pass 5.
- Manually confirm in the browser, in both themes: answer cards are visually distinct with the
  Not yet / Answered tag; point pills show on every gradable question; callouts render; the
  toolbar is one row and folds gracefully at 1280 to 1440px; part-progress segments show the
  three-state fill; switching parts swaps worksheet and simulation together with no picker; the
  per-part answered count ignores teaching sections; the top arrows and bottom labeled nav both
  move between parts and reset scroll; Finish & review opens the worksheet-only view over all
  sections, auto-scrolled to the Discussion and Conclusion heading, with earlier parts reviewable
  above and the integrity accept-gate plus export at the bottom, and a way back to a part; the
  discussion / conclusion questions appear only in review (not parked behind the two-conductor
  sim) and are editable inline; text size and layout persist across a fresh navigation; the
  simulation iframe never reloads or animates on a layout or zoom change; **a sim keeps its state
  across part navigation (charge John Travoltage in Part 1A, go to 1B, return to 1A, and the charge
  is still there)**; PDF export still includes every section across all parts and the review tail
  with the process record intact.
