# Pre-Implementation Alignment Report: Start Screen + Lab Workspace Redesign

**Date:** 2026-06-30
**Scope:** Pressure-tests the three specs (`docs/specs/START_SCREEN_SPEC.md`,
`SIMS_SPEC.md`, `LAB_WORKSPACE_SPEC.md`) against the actual design mocks and the current
codebase, ahead of an autonomous (Ultracode) implementation run.
**Materials reviewed:** `HANDOFF.md`; the two prototype sources `LabFrame Start.dc.html` and
`LabFrame Lab.dc.html` (read top to bottom, including their `<script data-dc-script>` logic);
`support.js` (the design tool's `sc-if` / `sc-for` / `DCLogic` runtime); the two render
screenshots (current catalog "before"; new lab workspace "after"). Cross-checked against
`LabPage.tsx`, the lab/course schemas, the section views, `MarkdownBlock`, the persistence
layer, and the real `chargeBuildup` lab content.

**Resolution status (folded into the specs):** all findings below have been applied to the three
specs to make the set run-ready. Two clarifications from the author shaped B-1 / B-2: (1) the
within-part scroll is **retained** (a part scrolls in the worksheet pane; only the
all-parts-in-one scroll is removed, and the sticky "next" primitive swaps the part's sections and
its bound sim together); (2) "Finish & review" shows **all parts in worksheet-only (tab) view
with the simulation hidden**, then the existing integrity accept-gate and export at the end. See
`LAB_WORKSPACE_SPEC.md` Pass 5 "What changes and what does not" and the "Submission and review
flow" section.

---

## Bottom line

The specs are substantially correct and, in several places, more rigorous than the mocks
(they adopt the real storage keys, derive progress from real persistence, and add URL-based
deep-linking the prototype lacks). Reading the actual mock source changed nothing structural,
but it surfaced **two functional gaps that will break the build if left to an agent's guess**
(integrity / export placement, and the "Finish & review" destination), **five spec wording
adjustments** where the spec is vaguer or slightly off from the mock, and **several regression
risks** specific to handing a prototype `<textarea>` to an agent that will rebuild the
instrumented `Field`. None are blockers; all are cheap to fix in the specs now.

Priority before the run: resolve B-1 and B-2 (functional gaps), then apply the C and D notes.

---

## A. Confirmations (the spec holds; do not change)

- **Storage divergence is real and correctly resolved.** `LabFrame Start.dc.html` literally
  does `localStorage.getItem("labframe_details")` with `{name, ta}`. The spec correctly
  rejects this in favor of the app's existing `labframe:student-name` / `labframe:ta-name`
  keys. Keep the spec's decision.
- **On deck = 2, Up next = 9.** The mock's static data is exactly the two `group: 'core'` labs
  (Charge Buildup, Coulomb's Law) on deck and the nine `coming-soon` labs as chips, matching
  the PHY 114 manifest. The derivation in `START_SCREEN_SPEC.md` is right.
- **`foldDown`, not `max-height`.** The mock defines `@keyframes foldDown` and animates the
  form's appearance; the leftover `formMaxH` / `formOpacity` state values are computed but never
  bound in the markup. This confirms the spec's "render conditionally, animate appearance only."
- **Text-size values exact.** The mock's `zoomMap = { S: 0.88, M: 0.96, L: 1.08 }`, default M,
  applied as `zoom` on the worksheet content wrapper. Pass 7 matches to the number.
- **Answer card + point pill + status tag.** The mock's answerable block is exactly Pass 1 / 2:
  1px border + 3px `#6366e8` left rule + faint indigo fill, `YOUR ANSWER` eyebrow, a status tag
  flipping `Not yet` (grey) to `Answered` (green) on non-empty input, and a `1 pt` / `0.5 pt`
  pill placed either beside a heading or inline in the prompt. Both placements occur; the spec's
  "with the prompt or heading" is correct.
- **Process record already exists.** The mock's integrity copy ("pastes, autocomplete
  suggestions, and edit timing are logged") describes capture that is already built
  (`attributePastes.ts`, `formatDuration.ts`). The spec correctly treats this as reconciliation,
  not new work.

---

## B. Required spec adjustments (with justification)

### B-1. Define where the integrity accept-gate and PDF export live in the parts model (FUNCTIONAL GAP)

- **Finding.** The mock shows only an _informational_ amber "Integrity agreement" card at the
  top of Part 1A ("Your report includes a process record..."). The real app's
  `IntegrityAgreement` is an _interactive accept-gate at the bottom of the single scroll_ that
  blocks `exportPdf()` until accepted, and the export button lives there too. Pass 5 removes the
  single scroll and renders one part at a time, so the place the accept-gate and export button
  currently live no longer exists. The mock has no export button at all (only `Save draft` and a
  green `Finish & review` on the last part).
- **Adjustment.** `LAB_WORKSPACE_SPEC.md` must state explicitly: (a) the informational integrity
  blurb appears once at lab entry (top of the first part), and (b) the interactive accept
  checkbox + preflight + signed export move to a **review step reached by "Finish & review"**
  (see B-2), not into every part. The accept state and preflight
  (`validateStudentInfoForPdf`, `IntegrityAgreement`, `exportPdf`) must remain wired to that
  step.
- **Justification.** Without this, an autonomous run either drops the export path (students
  cannot submit) or scatters the accept-gate per part. This is the single highest-risk gap.

### B-2. Specify the "Finish & review" destination

- **Finding.** The mock's last-part button is green `Finish & review ›`, but the prototype has
  no such screen. The real submission flow (preflight to integrity-accept to sign to seal to
  download) has nowhere to live in the parts layout.
- **Adjustment.** Define "Finish & review" as navigating to a review state that hosts the
  existing export controls. Simplest fit with the locked `?part=` model: a terminal synthetic
  part (for example `?part=review`) that renders a whole-lab summary (all sections / answered
  counts) plus `IntegrityAgreement` and the export button. Reuse the current components; do not
  rebuild them.
- **Justification.** Pairs with B-1; turns an undefined button into a concrete, buildable
  target and keeps the signed-PDF flow intact.

### B-3. Per-part counts and segments count ANSWERABLE sections only

- **Finding.** The mock computes `sectionAnsweredCount` and the toolbar segment fill over each
  part's `qids` (the answerable questions), not over all content. A part is mostly teaching
  (Background prose, the NOTE callout, numbered steps) with a few questions; the real
  `chargeBuildup` part would contain `instructions` and `objective` sections too.
- **Adjustment.** In `LAB_WORKSPACE_SPEC.md` (Pass 1 shared predicate, Pass 3 header count,
  Pass 4 segments), state that the answered count and segment state are computed over the
  **answerable** sections in a part's range only, excluding `instructions` (and any
  non-field-bearing kind). Reuse the existing answered predicate from `ProgressBar` /
  `buildTocEntries`, scoped to the part's range.
- **Justification.** Counting teaching sections would make "2/3 answered" wrong and mis-fill the
  segments. The mock's qid-based logic encodes this; the spec should too.

### B-4. Toolbar segments are per-PART, with a three-state fill

- **Finding.** The mock renders exactly one segment per part (3 here), colored `#6366e8` when
  every question in the part is answered, `rgba(99,102,232,0.45)` when some are, and
  `rgba(255,255,255,0.09)` when none. `LAB_WORKSPACE_SPEC.md` Pass 4 calls them
  "section-progress segments."
- **Adjustment.** Reword Pass 4 to "part-progress segments, one per part," and specify the
  three-state fill (all / some / none answered).
- **Justification.** With the parts model, one-segment-per-section would be far too many; the
  mock is explicit that segments map to parts.

### B-5. Start-screen header motif is a NEW compact SVG, not the existing `HeroIllustration`

- **Finding.** The mock's header motif is a compact `220x92` inline SVG: two charges (`+`
  `#4f54d6`, `-` `#f5b942`), two field-line curves, one dashed animated connector
  (`dash 1.4s`), and a drifting sine (`waveMove 9s`). The existing
  `src/ui/catalog/HeroIllustration.tsx` is a `560x372` "ink and graph" piece (ruler ticks,
  dimension callout, escape lines, draw-in). The "before" screenshot confirms the current
  catalog uses that larger illustration. `START_SCREEN_SPEC.md` says "extend the existing
  `HeroIllustration`."
- **Adjustment.** Change the spec to "author a new compact animated motif component" matching
  the mock geometry, rather than extending `HeroIllustration`. The two ambient animations
  (`dash`, `waveMove`) are authored for the small geometry and the `-64px` (one wavelength)
  loop.
- **Justification.** Different size, composition, and role (header accent vs catalog hero).
  Forcing the large illustration into the header will not match the mock and the wave-loop math
  is tied to the compact path width.

---

## C. Undefined gaps to settle before the run

### C-1. Migration is not a literal copy of the mock

The mock is a simplified slice: 3 parts, 8 textareas, and only 2 of Charge Buildup's 3
simulations (`twoConductorInduction` is never used). The real `chargeBuildup` lab (reused from
`phy132ChargeBuildupLab`) has **25 sections** (19 `concept`, 5 `instructions`, 1 `objective`)
and **3 simulations**. The migration step in Pass 5 must:

- Map the real 25 sections into part `sectionRange`s (teaching + answerable together), not
  transcribe the mock's 8 questions.
- Decide what happens to `twoConductorInduction`. **Resolved:** the real lab uses it in Part 1C
  (it was only the simplified mock that dropped it), so no sim is orphaned. See the worked
  Charge Buildup parts example in `LAB_WORKSPACE_SPEC.md`. A validator **warning** for any
  `lab.simulations` entry referenced by no part still guards future labs.
- Note that a `simulationId` may be reused across parts (the mock's 1A and 1C are both John
  Travoltage); the schema's many-parts-to-one-sim is intended, not a mistake to "fix."

State this in `LAB_WORKSPACE_SPEC.md` so the run treats the mock as illustrative.

### C-2. Active part: confirm URL param overrides the mock's local state

The locked decision is `?part=` in the URL. The mock uses local React state
(`activeSection: 0`) with no URL. Add a one-line note that this is a deliberate upgrade over the
prototype, so an agent matching the mock does not revert to local-only state. Define the default
(first part when no param) and that part nav uses `setSearchParams` (the existing pattern) and
resets `.worksheet-pane` `scrollTop` to 0.

### C-3. "Sections" dropdown semantics shift to parts

The toolbar `Sections` menu maps to the existing `TableOfContents` popover, which currently
lists every section flat via `buildTocEntries`. In the parts model it should navigate parts (or
group sections under their part). Note this so the TOC is updated, not left listing raw sections
that no longer correspond to the one-part-at-a-time view.

### C-4. Start-screen "Just explore" button is absent from the mock

The `/sims` entry button is described in the handoff but does not appear in
`LabFrame Start.dc.html`. Its placement and styling are designer-intent only. Note in
`SIMS_SPEC.md` that this is not a pixel-match item; build it in the card visual language near
Your details per the handoff.

### C-5. Completed-section example is the onboarding tour

The mock's single completed card is "Getting Started / Tour & Controls / May 4," not a graded
lab. Since the Completed section is deferred, just record the open question for when it lands:
does Completed list only graded labs, or also the welcome/tour completion? It affects the
derivation source.

---

## D. Codebase regression risks for an autonomous run

### D-1. Do not detach `Field` instrumentation when building answer cards

The mock's answer input is a plain `<textarea>`. The real app routes answers through the
instrumented `Field` primitive that feeds paste attribution and edit-timing into the signed
process record. An agent rebuilding the Pass 1 card from the prototype's textarea could silently
replace `Field` and drop the process record from the PDF. The spec already says "do not detach
the `Field` instrumentation"; elevate this to a callout in Pass 1, because the mock actively
invites the mistake.

### D-2. Keep the split-drag handle; the mock's fixed 50/50 is a simplification

The mock hardcodes `flex: 1 1 50%` and has no resize handle. The real app has `SplitHandle` +
persisted `splitFraction`. An agent matching the mock could delete the resize affordance. Note
that the draggable split is retained; only the sim picker is removed (Pass 5).

### D-3. One-row 52px toolbar will overflow at laptop widths

The mock packs roughly fifteen controls into one row and is drawn wide. The handoff says
low-priority chrome collapses to icons / the `...` overflow. Make the **collapse priority order
explicit** in Pass 4 (for example: keep wordmark, part label, student name, save status, Side or
Tabs, and primary actions; fold Theme, Text size, Swap, About, and Take the tour into `...`
first). Without an explicit order an autonomous run tends to produce a row that wraps or clips
on a 1280 to 1440px screen.

### D-4. `zoom` for text size is acceptable but document the choice

`zoom: 0.88 / 0.96 / 1.08` is now broadly supported (Firefox added it in 126, 2024) and is safe
relative to the iframe-stability invariant because it is applied only to the worksheet content
wrapper, which is in the opposite pane from the simulation iframe. Keep it (it matches the mock
and is one line), but state in Pass 7 that it is intentional and must stay scoped to the
worksheet content wrapper, never an ancestor of the iframe. Be aware it reflows worksheet layout
(any pixel-position e2e assertion on the worksheet must account for the active scale).

---

## E. Suggested spec edits checklist

`LAB_WORKSPACE_SPEC.md`:

1. Add a "Submission and review flow" subsection covering B-1 and B-2 (integrity blurb at entry;
   accept-gate + preflight + export behind `?part=review`).
2. Pass 1 / 3 / 4: per-part counts and segments use answerable sections only (B-3); segments are
   per-part with a three-state fill (B-4).
3. Pass 5: add the migration reality (C-1), the orphaned-sim validator warning, and the
   reused-`simulationId`-across-parts allowance.
4. Pass 5 / 7: one-line note that `?part=` overrides the mock's local state (C-2); `zoom` stays
   scoped to the worksheet wrapper (D-4).
5. Pass 4: explicit toolbar collapse priority order (D-3); `Sections` dropdown navigates parts
   (C-3).
6. Pass 1: elevate the `Field`-instrumentation preservation note to a callout (D-1); note the
   split handle is retained (D-2).

`START_SCREEN_SPEC.md`:

7. Header: author a new compact animated motif rather than extending `HeroIllustration` (B-5).

`SIMS_SPEC.md`:

8. Note the "Just explore" button is not in the mock; build it in the card language near Your
   details (C-4).

None of these change the locked decisions (parts grouping layer with index ranges, `?part=`
URL, migrate the two live labs, Inter + JetBrains Mono). They close the gaps the prototype left
implicit so the run has nothing to guess.
