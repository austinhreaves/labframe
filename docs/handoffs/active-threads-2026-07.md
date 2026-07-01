# Active Threads - July 2026

**Last updated:** 2026-07-01
**Purpose:** One-page orientation for a cold agent session. Read this before opening any spec.

---

## Open branches / PRs

| Branch | PR | Status | What it contains |
|--------|----|--------|-----------------|
| `claude/eloquent-hypatia-66a4c5` | #22 | In progress -- Passes 1-6 done, Finish & Review flow remaining | Start screen + lab workspace redesign (7 passes, parts model, sim keep-alive) |

Specs for PR #22 live on that branch: `START_SCREEN_SPEC.md`, `SIMS_SPEC.md`,
`LAB_WORKSPACE_SPEC.md`, `start-lab-redesign-alignment.md`, `start-lab-redesign-handoff.md`.
Do not copy them to main until the PR merges.

---

## Specs: active (by priority)

**1. Integrity Inspector** -- `docs/specs/INTEGRITY_INSPECTOR_SPEC.md`
The next build target after the lab workspace redesign lands. A standalone static TA page
that accepts a `lab.json` or signed PDF drag-and-drop and gives a forensic view of paste
events, timeline, and field-by-field reconstruction. Three-tab layout. No LLM calls in v1;
grading automation (LLM-assisted scoring) is on the roadmap as a future evolution.

**2. Verify-Lab two-track split** -- `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md`
Track 1 (deterministic CI gate: `npm run verify:labs`) is shipped. Track 2 (Fable pedagogy
rubric, `npm run verify:lab:pedagogy`) is earmarked but not yet built. Rubric is in the spec;
tooling and the Fable prompt are not written yet.

**3. Lab workspace redesign** -- see PR #22 above.

---

## Specs: deferred (do not start without explicit sign-off)

| Spec | Reason deferred |
|------|----------------|
| `LAB_MANUAL_SPEC.md` | Fable to re-scope before any code |
| `GRAPHING_EXPANSION_SPEC.md` | Execute per-need when a specific lab requires a new fit type |
| `POLISH_SPEC_B_BUTTONS_SEGMENTED.md` | SegmentedControl not built; remainder deferred |
| `POLISH_SPEC_D_CATALOG.md` | Some catalog changes landed; full scope deferred |
| `PHY112_TIER_AB_SPEC.md` | PHY 112 content authoring; no code yet, deferred |

---

## Handoffs: still relevant

- `docs/handoffs/log-axis-support-handoff.md` -- self-contained. Execute when a lab needs
  log-x or log-log axes.
- `docs/handoffs/multi-series-plot-handoff.md` -- self-contained. Execute when a lab needs
  multiple series on one plot.
- `docs/handoffs/mutation-testing-baseline.md` -- informational reference for the Stryker
  setup. Not a task; see CLAUDE.md Commands table.

---

## On the radar (no spec yet)

- **Assignment Constructor Phase E** -- formula DSL for authored labs. Phases A-D shipped
  (labDoc schema, authoring services, file import, My Labs, `/i/:hash` route, `/author` UI).
  Phase E is the next step but has no spec yet.
- **Fable pedagogy rubric** -- Track 2 of the verify-lab split. Needs a rubric + Fable
  prompt. See `VERIFY_LAB_TWO_TRACK_SPEC.md` open questions before designing.
- **LLM-assisted grading** -- future evolution of the Integrity Inspector. No spec yet.
- **Theory references** -- PHY 114 student-facing `.md` / `.html` files in `docs/theory/`.
  Currently only Lab 1 exists. Authoring process is in
  `docs/archive/theory-references-handoff.md` (archived -- stale); a fresh Fable pass will
  generate the remaining labs. Do not use the archived handoff as a template without
  re-reading it against current lab content.

---

## What shipped recently (as of 2026-07-01)

| Feature | Commit | Spec (now archived) |
|---------|--------|---------------------|
| Overleaf-lite equation editor | 514461c | `docs/archive/OVERLEAF_LITE_SPEC.md` |
| Onboarding tour + course scoping | 29a424a | `docs/archive/ONBOARDING_COURSE_SCOPING_SPEC.md` |
| PHY 132 unit cleanup | a93b394, c152c88 | `docs/archive/phy132-unit-cleanup-handoff.md` |
| Verify-lab CI gate (Track 1) | 5e1073d, e5a4bb0 | `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (active) |
