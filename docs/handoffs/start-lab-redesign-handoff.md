# Handoff: Start Screen + Lab Workspace Redesign

**Branch:** `claude/eloquent-hypatia-66a4c5` (PR #22).
**Status:** Implemented (2026-07-01): lab workspace passes 1-7 + parts model + Finish &
review, the start screen, and `/sims`. Only the start screen's Completed section remains
deferred (needs report persistence; see `START_SCREEN_SPEC.md`).

## What this is

A redesign of LabFrame's start screen, a new `/sims` exploration page, and a seven-pass
redesign of the lab workspace. The design sources are the Claude Design prototypes in
`docs/handoffs/Labframe UX review-handoff/` (`LabFrame Start.dc.html`, `LabFrame Lab.dc.html`,
plus screenshots). Everything was specced against the real codebase, not just the mocks.

## Read these, in order

1. `docs/specs/START_SCREEN_SPEC.md` - the landing page (Header, Your details, On deck, Up next,
   Just explore, About/FERPA). Completed slider is deferred.
2. `docs/specs/SIMS_SPEC.md` - the `/sims` "Just explore" page (card grid of every course sim,
   links out to PhET). Small, self-contained, no schema change.
3. `docs/specs/LAB_WORKSPACE_SPEC.md` - the big one. Seven passes plus the parts model, the
   simulation keep-alive rule, and the Submission and review flow. Start at the Overview's
   "Guiding principle" and read straight through.
4. `docs/handoffs/start-lab-redesign-alignment.md` - the pressure-test report: what already
   exists in the code vs what is new, and the regression traps to avoid. Read before coding.

## The few things most likely to trip you up

- **Much of the workspace already exists.** Split/tabs/swap/theme/autosave, point captions,
  `[!NOTE]` callout rendering, and the integrity process record (paste + edit-timing) are all
  built. Confirm before rebuilding. See the alignment report.
- **The parts model (Pass 5) is the only real schema change.** Optional `parts` grouping layer
  over flat `sections`, index ranges, `?part=` URL. Parts cover a sim-coupled prefix; sim-less
  discussion/conclusion sections are the "review tail" surfaced in Finish & Review.
- **Simulation keep-alive is mandatory.** A sim must not unmount/remount on part navigation or it
  wipes the student's in-sim state. One persistent iframe per distinct `simulationId`, lazy mount,
  `display:none` toggling, never re-key. This replaces the current `key={activeSimulationId}`.
- **Do not detach the `Field` instrumentation** when building answer cards, or the signed PDF
  loses its process record.
- A worked `parts` mapping for Charge Buildup is in `LAB_WORKSPACE_SPEC.md` (Pass 5). Two soft
  authoring nudges are flagged there (the "Review" progress segment; the 1C/tail boundary).

## Suggested build order

Per the spec's "Build order" section: Pass 2 + Pass 1 (low risk), then Pass 7 + Pass 4 (layout),
then Pass 5 (parts model + the two live PHY 114 lab migrations), then Pass 3 + Pass 6 + the review
flow. `/sims` and the start screen are independent tracks.

## Repo basics (from CLAUDE.md)

- No em dashes anywhere (prose, content, commits, docs).
- Typecheck is `npm run typecheck` (tsc -b), not `npx tsc`. Run `npm run ci` before a PR and
  `npm run test:e2e` for any UI/routing/layout change. `npm run verify:lab -- <labId>` after a
  schema or lab-content change.
- The `PowerShell` tool is broken in this harness; run PowerShell via `Bash` with
  `pwsh -NoProfile -Command '...'`.
- Branch from this branch; it tracks `origin/claude/eloquent-hypatia-66a4c5`. Keep PRs focused.
