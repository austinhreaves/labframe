# Start Screen Redesign Spec

**Status:** Not started. Spec only (the source handoff was explicit: brainstorm and write
spec, not edit code).
**Created:** 2026-06-29
**Source:** `LabFrame Start.dc.html` mock + the start-screen handoff.
**Companion spec:** `docs/specs/SIMS_SPEC.md` covers the "Just explore" / `/sims` path,
which is new infrastructure and ships as a separate pass.

---

## Overview

The start screen is the first thing a PHY 114 student sees. The redesign reorders the page
so the **playable labs are the hero action** and the not-yet-built labs are pushed out of the
way. Top to bottom:

| Section       | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| Header        | Wordmark + course chip + tagline + animated physics motif            |
| Your details  | Name / TA entry, collapses to a summary bar after save               |
| On deck       | The playable labs the student should do next (derived from progress) |
| Up next       | Upcoming labs, de-emphasized as chips                                |
| Just explore  | Secondary entry to `/sims` (see companion spec)                      |
| Completed     | Foldable slider of finished labs with report links (DEFERRED)        |
| About / FERPA | Two accordions                                                       |

Voice, kept prominent but not overbearing:

> "Predict, observe, and explain, at your pace. Show your work; save as you go."

**Non-goals:**

- Any server-side state, accounts, or login. The no-backend constraint (ADR-0002) is absolute.
- A new progress data model. On deck / completion is derived read-only from existing
  persistence (see Progress derivation).
- Persisting report PDFs. The Completed section depends on that and is deferred.

**Conventions reminder (from CLAUDE.md):** no em dashes anywhere; PHY 114 is algebra-based
(no uncertainty content); verify types with `npm run typecheck` (tsc -b); run `npm run ci`
before a PR and `npm run test:e2e` for any UI / routing / layout change.

---

## Locked decisions

1. **Defer the Completed section.** First cut ships Header, Your details, On deck, Up next,
   Just explore, About/FERPA. The Completed slider and the report persistence it needs are
   spec'd here as an explicit later pass.
2. **Replace the catalog everywhere.** The new On deck / Up next layout replaces the catalog
   grid that `Catalog` renders on `/`, `/labs`, and `/c/:courseId`. The layout is
   course-scoped: a single course in view (a pinned course, or `/c/:courseId`) renders one On
   deck / Up next block; the multi-course staff index (`/labs`, or `/` with no pin) stacks one
   block per course.
3. **Adaptive theme.** Build with the existing CSS variables in `src/ui/tokens.css` so the
   screen respects the light / dark toggle (`src/ui/theme.ts`). The dark mock is the
   dark-mode appearance; there is no dark-only override layer.
4. **Reuse the current font stack.** Space Grotesk (`--font-display`) for display and labels,
   Inter (`--font-sans`) for body. Do not add IBM Plex Sans.

---

## Current state (what is being replaced)

The start screen today is `src/ui/Catalog.tsx`, a three-step wizard (name then course then
lab) plus a catalog grid, rendered at `/`, `/labs`, and `/c/:courseId` through
`src/app/Routes.tsx`. There is no On deck / Up next / Completed concept. Student details
already persist as two localStorage keys, `labframe:student-name` and `labframe:ta-name`,
read and written through the `safeStorageGet` / `safeStorageSet` helpers. Course pinning
(`labframe:course`, set by `pinAcademicCourse`) already scopes the interface to one course.

Reusable pieces to carry forward rather than rebuild:

- `AboutAndPrivacy` and the generic `Disclosure` component (for the About / FERPA accordions).
- The `?student=` hand-off when navigating into a lab
  (`/c/:courseId/:labId?student=<encoded name>`).
- `safeStorageGet` / `safeStorageSet`, `pinAcademicCourse`, the theme toggle, and
  `HeroIllustration` / `LogoMark` from `src/ui/catalog/HeroIllustration.tsx`.

---

## Section-by-section spec

### Header

- Wordmark `LabFrame` in `--font-display` (Space Grotesk, weight 700) plus a course chip
  (`PHY 114`) and a tagline directly beneath, around 17px, in muted text.
- Right side: a compact physics motif. Author a **new** small SVG component (the mock is a
  `220x92` inline SVG: two charges with `+` indigo and `-` amber, two field-line curves, one
  dashed animated connector, and a drifting sine), not the existing `HeroIllustration`. That
  component is a `560x372` "ink and graph" catalog hero (ruler ticks, dimension callout, escape
  lines) sized and composed for a different role; the new start screen replaces the catalog, so
  this compact header motif supersedes it. Carry the two ambient animations from the Animation
  spec below; the `waveMove` loop math is tied to the compact path width. Keep it `aria-hidden`
  and themed through CSS custom properties.

### Your details (collapsible, persisted)

- **Editing state:** title "Start a lab - your details", a required `Your name` input, an
  optional `TA name(s)` input, a `Save & continue` button, and FERPA microcopy. Bind name to
  `labframe:student-name` and TA to `labframe:ta-name` (same keys and helpers used today).
- **On save:** write both keys, fold the form up, and show a slim summary bar: a green check,
  the name, the TA (or "No TA listed"), "saved on this device", and an `Edit` button.
- **On load:** if `labframe:student-name` already exists, render straight into the collapsed
  summary state.
- **Animation:** use a CSS `foldDown` keyframe for the appearance of the form or summary.
  Do NOT drive open / close with a transitioned `max-height`; the handoff records that as
  unreliable in this runtime. Render the active state conditionally and animate appearance
  only.

### On deck

- Heading `ON DECK - ready for you - based on your progress`.
- Large primary cards for the playable labs the student has not completed. For PHY 114 today
  that is the two `group: 'core'` labs, `chargeBuildup` (Lab 1) and `coulombsLaw` (Lab 2).
  Each card: a lab-number / tag pill, a green "Ready" dot, the lab title, a one-line
  description, and a `Start this lab` action.
- **Card link:** navigate to `/c/<courseId>/<labId>?student=<encoded name>`, reusing the
  existing hand-off so the lab page picks up the student name.
- **Derivation:** On deck = manifest labs that are `enabled` and unlocked and NOT completed,
  ordered by `labNumber`. See Progress derivation. As labs are completed they leave On deck
  (and, once the Completed section ships, appear there).

### Up next

- Heading `UP NEXT - N labs coming to PHY 114`, with a `Course page` link to `/c/<courseId>`.
- The remaining `enabled` manifest labs rendered as quiet, low-emphasis chips (tag + title).
  For PHY 114 these are the `group: 'coming-soon'` labs (labs 3 through 11). These are the
  "Coming soon" items and are intentionally not navigable from here.

### Just explore (entry to /sims)

- A secondary `Just explore` button placed near the Your details card, deliberately not
  competing with the On-deck CTAs. Routes to `/sims`. Full behavior in `docs/specs/SIMS_SPEC.md`.

### Completed (DEFERRED, see "Deferred" below)

### About / FERPA

- Two accordions. Reuse `AboutAndPrivacy` / `Disclosure` from `Catalog.tsx`. The FERPA copy
  must state plainly that the name, TA names, and lab data never leave the browser, that
  reports are generated locally, and that nothing is sent to a server.

---

## Progress derivation

Progress is derived read-only from existing persistence; no new model is added in this pass.

Lab state persists under the key `lab:<courseId>:<labId>:<studentName>` (see
`src/state/persistence/keys.ts`), and `listLocalStorageKeys(prefix)` in
`src/state/persistence/local.ts` enumerates them. Each loaded record carries
`status.submitted`, which is set to `true` when the student exports the sealed PDF.

```text
studentName = safeStorageGet('labframe:student-name')
keys        = listLocalStorageKeys(`lab:${courseId}:`)            // all labs for the course
mine        = keys.filter(k => parseLabKey(k).studentName === studentName)
state[labId] = loadJSON(key).status.submitted ? 'completed'
             : 'in_progress'                                       // saved but not submitted
// a manifest-enabled lab with no saved record => 'not_started' / unlocked

onDeck   = manifest.labs
             .filter(l => l.enabled && state[l.ref] !== 'completed' && isUnlocked(l))
             .sort(by labNumber)
completed = manifest.labs.filter(l => state[l.ref] === 'completed')   // for the deferred section
```

`isUnlocked` for the first cut is simply "is a playable `core` lab" (the two live labs). If a
sequencing / prerequisite rule is wanted later it slots in here. Note `status.submitted` has
no timestamp today, so the Completed sort-by-`completedAt` in the mock cannot be honored until
the deferred work adds one.

---

## Animation spec

Two ambient motions in the header motif (the handoff calls these out as ones to keep):

1. **Electric field flow.** A dashed line animating from the positive charge to the negative
   charge.

   ```css
   @keyframes dash {
     to {
       stroke-dashoffset: -24;
     }
   }
   /* stroke-dasharray: 6 6; animation: dash 1.4s linear infinite; arrowhead marker-end */
   ```

2. **Slow sine wave.** An amber sine drifting left, one full wavelength per loop, seamless.

   ```css
   @keyframes waveMove {
     from {
       transform: translateX(0);
     }
     to {
       transform: translateX(-64px);
     }
   }
   /* on the sine path, extended by one wavelength beyond the viewBox so the loop has no gap:
      animation: waveMove 9s linear infinite; */
   ```

   The period is intentionally slow (around 9s). The path must span wider than the viewBox so
   the `-64px` (one wavelength) translate loops with no visible jump. If the wavelength
   changes, keep `translateX` equal to exactly one wavelength.

Gate both behind `prefers-reduced-motion: reduce` (pause them), consistent with the existing
`hero-draw` draw-in animation in `main.css`.

---

## Styling

- Map the mock's palette and radii onto the existing tokens in `src/ui/tokens.css` rather than
  hard-coding hex values. The mock's dark surfaces map to the dark-mode neutral tokens; the
  indigo / amber / green accents map to the existing accent and status tokens. The mock is the
  dark-mode appearance under the adaptive-theme decision.
- Type: `--font-display` (Space Grotesk) for the wordmark, section labels, and headings;
  `--font-sans` (Inter) for body.
- Minimum 44px hit targets. Watch contrast on the muted greys, especially in light mode where
  the dark-mock greys would be too faint.

---

## Routing impact

The new layout swaps in for the `Catalog` body. `/`, `/labs`, and `/c/:courseId` keep their
existing entry points in `src/app/Routes.tsx`; only what `Catalog` renders changes. Course
scoping continues to reuse `pinAcademicCourse` and the `labframe:course` key, so a student who
entered through `/c/phy114` sees a single-course start screen, while the staff index renders a
per-course block for each course. A UI / routing change like this needs `npm run test:e2e`;
follow the repo note to navigate e2e tests directly to routes rather than clicking catalog
links.

---

## Deferred: Completed section

The mock's Completed section is a foldable, horizontally scrolling slider of finished labs:
header is a toggle (chevron + `COMPLETED` + count badge + "reports saved locally"); each card
shows the lab tag, a check plus completion date, the title, and an `Open report` link that
re-downloads the locally generated signed report. No "re-run" button.

This cannot be built faithfully yet because reports are ephemeral: the sealed PDF is generated,
downloaded, and forgotten, nothing is stored, and `status.submitted` carries no timestamp. A
later pass must add:

1. **A report registry slice** keyed per lab and student, recording at least `submittedAt` and
   a signature reference, written from the export flow in `src/ui/LabPage.tsx` (where
   `setSubmitted(true)` already fires).
2. **Sealed-PDF persistence** to IndexedDB on export (the seal step lives in
   `src/services/pdf/seal.ts`; blob storage already exists via
   `src/state/persistence/idb.ts`), so `Open report` re-downloads the exact original rather
   than re-signing. A suggested key shape: `pdf:<courseId>:<labId>:<studentName>:<sigPrefix>`.

Until then, the Completed section is omitted from the rendered page.

---

## Divergences from the handoff

The handoff made a few assumptions that the codebase contradicts; this spec follows the code:

- **Storage keys:** the app already uses `labframe:student-name` and `labframe:ta-name`, not a
  single `labframe_details` JSON blob. Reuse the existing keys and helpers.
- **Group naming:** the PHY 114 manifest tags upcoming labs `group: 'coming-soon'`, while the
  handoff and CLAUDE.md say `enrichment`. The manifest value is authoritative for Up next.
- **Fonts:** body stays Inter (`--font-sans`), not IBM Plex Sans (locked decision 4).
- **Theme:** adaptive via existing tokens, not a dark-only screen (locked decision 3).
- **Progress / report shape:** the handoff's suggested `labframe_progress` object and report
  re-download are not built in this pass; progress is derived read-only and the report store
  is deferred.

---

## Build phases (for the implementing agent)

1. New start-screen layout (Header, Your details, On deck, Up next, About/FERPA) replacing the
   `Catalog` body, adaptive theme, reusing the noted components. Add e2e coverage navigating
   directly to `/`, `/labs`, `/c/phy114`.
2. The animated motif (extend `HeroIllustration` + `main.css`), reduced-motion gated.
3. The `Just explore` button wired to `/sims` (the `/sims` page itself is the companion spec).
4. Later pass: report registry + sealed-PDF persistence, then the Completed slider.

## Verification

- `npm run ci` (typecheck, lint, format, unit) and `npm run test:e2e` for the layout / routing
  change.
- Manually confirm in the browser: details save and collapse to the summary bar and rehydrate
  on reload; On deck shows the two live labs and a `Start this lab` card opens the lab with the
  student name carried through; Up next lists the coming-soon labs as non-navigable chips; the
  motif animates and pauses under reduced motion; the page reads correctly in both light and
  dark themes.
