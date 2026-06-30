# Just Explore / `/sims` Spec

**Status:** Not started. Spec only. Separate pass from the start-screen redesign because
`/sims` is new routing and a new page.
**Created:** 2026-06-29
**Companion spec:** `docs/specs/START_SCREEN_SPEC.md` (the `Just explore` button that links here).

---

## Overview

`/sims` is a low-commitment entry point, separate from the graded lab flow. It renders a card
grid of every PhET simulation the course draws on. Each card links straight out to the PhET
website in a new tab. There is no LabFrame recording, no worksheet, and no report here; it is
pure exploration.

**Non-goals:**

- No simulation embed, recording, signing, or report flow. Cards are outbound links only.
- No accounts or server state (ADR-0002).
- No schema change. The data already exists (see Data source).

**Conventions reminder (from CLAUDE.md):** no em dashes anywhere; run `npm run ci` and
`npm run test:e2e` for this UI / routing change; `parentOrigin` allow-listing and telemetry
rules are not touched here since there is no embed or messaging.

---

## Entry point

A secondary `Just explore` button on the start screen, placed near the Your details card so it
does not compete with the On-deck CTAs. It routes to `/sims`. The button and placement are
owned by `docs/specs/START_SCREEN_SPEC.md`; this spec owns the destination page.

---

## Route

Add one route in `src/app/Routes.tsx`:

```tsx
<Route path="/sims" element={<Sims courses={courses} labsByCourse={labsByCourse} />} />
```

`courses` and `labsByCourse` are already constructed in that file, so the page reuses the same
manifest and lab registry the rest of the router uses. No new data wiring is needed.

---

## Data source (single source of truth)

The sim list is derived entirely from the course manifest plus the resolved lab objects, so
adding a simulation to a lab makes it appear on `/sims` automatically. Every simulation already
carries `title` and `url` under `Lab.simulations` (`SimulationSchema` in
`src/domain/schema/lab.ts`: `{ url, title, allow? }`), and the manifest gives `labNumber` and
`group` (`src/content/courses/phy114.course.ts`).

Derivation for PHY 114:

```text
for each labRef in phy114Course.labs where labRef.enabled:
  lab = labsByCourse['phy114'][labRef.ref]          // the runtime registry in Routes.tsx
  for each [simId, sim] in lab.simulations:
    emit { labNumber: labRef.labNumber, labTitle: lab.title,
           simId, simTitle: sim.title, url: sim.url }

dedupe the emitted rows by `url`                     // a sim shared across labs appears once
sort by labNumber
```

A lab can reference more than one simulation (for example the charge-buildup lab pulls John
Travoltage, Balloons and Static Electricity, and a two-conductor induction sim), and the same
sim can be shared across labs, hence the de-dup by `url`. The handoff's suggested per-entry
shape (`{ id, title, lab, phetUrl }`) maps directly onto the emitted rows; no manifest change
is required because the equivalent fields already live on `Lab.simulations` and the manifest
lab ref.

---

## Page

- A card grid that matches the start-screen visual language: existing tokens from
  `src/ui/tokens.css`, adaptive light / dark theme, same card styling and type as the start
  screen (Space Grotesk for labels, Inter for body).
- Each card shows the simulation title, the lab / topic it maps to (for example "Lab 1 -
  Charge Buildup"), and a thumbnail or placeholder.
- The whole card is a link straight to the simulation `url`, opened with
  `target="_blank" rel="noopener"`. No auth and no FERPA data is involved, since nothing is
  recorded.

---

## Build notes and open questions

- **Course scope:** the first cut targets PHY 114. Decide whether `/sims` always lists PHY 114
  or reads the pinned course (`labframe:course`) like the start screen does. Reading the pin is
  the more consistent choice and keeps a single code path when more courses go live.
- **Coming-soon labs:** because the derivation walks every `enabled` lab ref (not just the
  playable `core` ones), `/sims` surfaces the full set of simulations the course draws on,
  including those behind the `coming-soon` labs. That matches the handoff intent ("not just the
  built labs"). Confirm this is wanted; if not, filter to `group: 'core'`.
- **Thumbnails:** start with a placeholder (or the `LogoMark`) rather than fetching PhET
  preview images, to avoid an external dependency and keep the page offline-friendly. A later
  pass can add real thumbnails if desired.
- **De-dup rule:** de-dup by `url`. When the same sim maps to multiple labs, decide whether to
  show only the lowest `labNumber` mapping or list all mapped labs on the one card.

## Verification

- `npm run ci` and `npm run test:e2e`. For e2e, navigate directly to `/sims`.
- Manually confirm: the grid lists every simulation referenced by the enabled PHY 114 labs,
  shared sims appear once, each card opens the correct PhET URL in a new tab, and the page
  reads correctly in both light and dark themes. Add a simulation to a lab and confirm it
  appears on `/sims` without any other change (the single-source-of-truth check).
