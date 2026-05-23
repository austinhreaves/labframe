# HANDOFF: LabFrame — wire up all labs for review

**Date:** 2026-05-22
**Picked up in:** Claude Code, running natively on the local machine. The mount-cache and CRLF artifacts from the prior Cowork session (phantom `.git/index.lock`, stale reads, two git binaries disagreeing) do not occur here — one filesystem, one git, the real shell.

---

## Where things stand

`main` is on the clean `ec79300` baseline (`feat(pdf): integrity agreement module and plot axis titles`) plus the committed `.gitattributes`, plus the lab-port commit (`feat(phy132): add Charge Buildup and Coulomb's Law labs, replacing Static Electricity`). If that port commit is not yet in, commit it first — build and test suite were verified green before it.

PHY 132 currently has seven core labs, all wired and `enabled`: `chargeBuildup` (1), `coulombsLaw` (2), `chargesFields` (3), `capacitors` (4), `dcCircuits` (5), `magneticFieldFaraday` (6), `snellsLaw` (7). `ConceptSection` has an optional `preamble` field, rendered as markdown by `ConceptSectionView`.

## Goal of this round

Wire up *every* lab and leave everything **enabled**, so the whole course can be reviewed by clicking through the running app. There is no launch deadline — nothing is gated, everything is visible. After walking the app, Austin will document the next phase of changes separately.

---

## Make it reviewable

### 1. Wire the five enrichment labs into PHY 132

Five lab files already exist in `src/content/labs/phy132/` but are not wired into any course: `rcCircuits.lab.ts`, `rcLowPassFilter.lab.ts`, `rlHighPassFilter.lab.ts`, `rlcBandpassFilter.lab.ts`, `theveninsTheorem.lab.ts`. They are PHY 132 material.

Wire them so they render in the app, but presented as a **separate "enrichment" group** — distinct from the seven core labs, not interleaved into the 1–7 sequence.

Caveat to resolve first: the `Course` schema (`src/domain/schema/course.ts`) has no grouping concept — `labs` is a flat array of `{ ref, labNumber?, enabled, overrides? }`. So "enrichment group" needs a small design choice. Two reasonable options:

- Add an optional `group` (or `category`) field to `CourseLabRefSchema`, tag the five as `'enrichment'`, and have `Catalog` / `CatalogList` render the core and enrichment labs as separate labeled sections. Lighter; keeps them inside the PHY 132 course.
- A separate course manifest (e.g. a "PHY 132 — Enrichment" course).

The first is probably cleaner. Confirm with Austin before building.

Per-lab wiring follows the same pattern as the Charge Buildup / Coulomb's Law port: re-export each lab from `src/content/labs/index.ts`, import and register each in `labsByCourse.phy132` in `src/app/Routes.tsx`, and add manifest entries in `src/content/courses/phy132.course.ts`. Check each file's actual export name first (they are `*.lab.ts`, not drafts). Confirm each lab typechecks against the current schema and the build stays green.

### 2. Catalog display cleanup

For the review to read cleanly, the catalog must show lab titles, not internal refs. `CatalogList` in `src/ui/Catalog.tsx` currently renders `Lab N: {ref}`, leaking camelCase ids like `chargeBuildup`. Resolve `lab.title` from `labsByCourse` instead, so it reads `Lab 1: Charge Buildup`. `CatalogList` needs `labsByCourse` passed in to do the lookup.

### 3. Wire `title` into the on-screen chart

`src/ui/primitives/Chart.tsx` renders `section.plotId` as the visible `<h2>` heading and inside the chart's `aria-label`. So a Coulomb's Law plot currently shows `forceVsChargeGraphContainer` on screen instead of `Force vs. Charge`. The schema already has `PlotSection.title`, and the PDF renderer (`src/services/pdf/Document.tsx`) already derives a clean title from it; only the on-screen chart was never wired up.

Fix: in `Chart.tsx`, just before the component's `return`, add

```ts
const displayTitle = section.title ?? `${section.yLabel} vs. ${section.xLabel}`;
```

and replace `{section.plotId}` in the `<h2>` and in the `aria-label` with `displayTitle`. Leave the `X-axis: … | Y-axis: …` caption line and the Chart.js axis titles alone — `tests/unit/chart.test.tsx` asserts on that caption.

---

## Also outstanding

### "About LabFrame" + "Your data and FERPA" landing-page sections

Separate from the lab review, but still owed. Add two sections to the bottom of the landing page (`src/ui/Catalog.tsx`, below the catalog list, in both the wizard and non-wizard branches) and remove the old FERPA popover.

Remove from `Catalog.tsx`: the `FERPA_DISMISSED_STORAGE_KEY` constant, the `isFerpaDialogOpen` state and `ferpaDismissed` const, the `Tooltip`-wrapped "FERPA details" button and its `AccessibleDialog`, and now-unused imports. Replace the wizard's FERPA note paragraph with plain text: "Your name is saved only in this browser. See the privacy section below for details."

Add two `<section>` blocks with `<h2 id=…>` + `aria-labelledby`. Copy below is final and Austin-reviewed — **use verbatim** (first person, no em dashes, process-record detail deliberately deferred to the syllabus).

**About LabFrame:**

> LabFrame is the browser-based lab environment for PHY 132 at Arizona State University. There is no account to create and nothing to install. You follow a link from Canvas, select your lab, and work through it on a single page that holds the simulation, the prompts, the data tables, and the plots together. When you are done, you export a PDF and submit that PDF to the corresponding Canvas assignment.
>
> Every simulation in the course is openly-licensed and open-source. Most come from the PhET Interactive Simulations project at the University of Colorado Boulder, with additional simulations drawn from the Open Source Physics community and other openly-licensed projects. All lab manuals are written for this course or adapted from openly-licensed material. You will not be asked to buy a textbook, an access code, or a lab kit. I chose to build LabFrame on open simulations and an in-house platform for a reason: commercial lab platforms tend to gate basic functionality behind paywalls, send student interaction data to third-party vendors, and constrain courses to whatever pedagogy fits a publisher's product. Working with open tools lets the course evolve in response to what is actually working for the students taking it.
>
> I currently develop and maintain LabFrame on my own, which has one nice side effect: bug fixes and improvements can ship the same week they are reported. If something in LabFrame is buggy, confusing, or getting in the way of the physics, please let me know so I can fix it. Instructor contact information is in the course syllabus.

Links: "PhET Interactive Simulations" → `https://phet.colorado.edu/`; "Open Source Physics" → `https://www.compadre.org/osp/`. Use `rel="noreferrer noopener" target="_blank"`.

**Your data and FERPA:**

> I designed LabFrame to keep your work on your device while you do it. Your name, your in-progress lab responses, your data tables, your fit selections, and any images you attach are stored in this browser's local storage. While you are working through a lab, nothing is transmitted to a LabFrame server, and no third-party analytics or vendor data harvesting is involved. The interactive simulations themselves load from their original open-source hosts (PhET, Open Source Physics, and similar projects) via embedded frames.
>
> When you click Export PDF, the file you generate contains your worksheet responses, data tables, plots, and a process-record appendix. You submit that PDF to Canvas yourself; LabFrame does not separately transmit your work to anyone. Course instructors and TAs see your submission through the normal Canvas grading workflow. The process-record appendix is described in detail in the course syllabus.
>
> Because your work lives in this browser's storage, switching devices, clearing browser data, or working in a private or incognito window will lose your draft. Use the Save Draft button regularly, and export a backup PDF before walking away from a lab for a long time. If you are using a shared or public computer, clear your browser data after your session.

CSS: add `.catalog-about` / `.catalog-privacy` rules in `src/main.css` (≈48rem max-width, looser line-height, top margin); simplify `.catalog-ferpa-note` to plain secondary-color text since it no longer wraps a button.

---

## Deferred — pre-launch gating (NOT this round)

The earlier plan to gate the course for a Lab-1-only launch — an `isLabEnabled` URL guard in `Routes.tsx`, disabling labs in the manifest, placeholder "coming soon" labs, removing Snell's Law from the manifest — is on hold. It is the opposite of this round's goal, which is everything visible for review. Revisit only when a launch date returns. A spec for it can live at `SPEC_LAB_URL_GATING.md` if/when it happens.
