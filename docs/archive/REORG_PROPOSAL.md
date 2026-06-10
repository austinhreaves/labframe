# Lab Reorganization Proposal

Companion to `LEGACY_PARITY_INVENTORY.md`. Applies a **~90-min-per-session** budget across all 12 legacy labs, splits the monoliths, removes content that doesn't belong in a given course track, and adds new PHY 132 content for proper STEM-major curriculum coverage.

This proposal incorporates Austin's decisions from 2026-05-02:

- ~~Lab numbers~~ → **prerequisite DAG + pacing** (see "Sequencing model" below)
- Snell's Law **removed from PHY 132** (optics doesn't belong in calc-based E&M); kept in PHY 114
- Three new PHY 132 AC labs structured as a **filter sequence**: RC low-pass → RL high-pass → RLC bandpass
- All `objective` answer keys **normalized** (no more `q1` legacy variants)
- PHY 132 dcCircuits Discussion section **carried forward** into `kirchhoffsLaws` (treating the legacy omission as a bug)
- Schema extensions for log-axis and multi-series plots **deferred to agent handoffs** (`docs/handoffs/`); current scaffolds use workarounds

## Anchor decisions

- **Target session length:** ~90 minutes (one focused learning session / single brain cycle).
- **Scope:** All 12 legacy labs reviewed.
- **PHY 114 symmetry:** Where PHY 132 splits, PHY 114 splits the same way (so course structure stays parallel and the migration script can share section definitions). Course-specific labs (snellsLaw in PHY 114, the AC filter sequence in PHY 132, etc.) stay course-local.
- **Naming:** Topic-focused IDs (`ohmsLaw`, `kirchhoffsLaws`, `theveninsTheorem`) rather than legacy-derived (`dcCircuitsPart1`). Filename: `<labId>.lab.ts` in `src/content/labs/{phy132,phy114}/`.

## Sequencing model: prerequisite DAG, not lab numbers

Labs get rearranged, rescheduled, and extended too often for fixed numbering to stay accurate. Instead:

- Each `CourseLabRef` carries an optional `prerequisites: string[]` listing other lab IDs that should be completed first.
- Course-level pacing config sets the cadence (e.g., `pacing: { labsPerWeek: 1, suggestedCompletionWeeks: 14 }`).
- An optional `suggestedOrder: number` provides a default sort for UI display, but is not authoritative — the prereq graph is.
- Students see all labs that are unblocked by their completed prereqs as "available". Visual hint (greyed title + tooltip) shows what's still locked and what unlocks it. No hard lockout to start; respect student autonomy.
- A CI check validates the prereq graph: every prereq must point at an enabled lab, no cycles, no orphans.

### Schema extension required (CourseLabRef)

```ts
{
  ref: 'rcLowPassFilter',
  enabled: true,
  prerequisites: ['rcCircuits', 'electromagneticInduction'],  // NEW
  suggestedOrder: 13,                                          // NEW (display hint)
  // labNumber removed
}
```

### Course-level pacing (Course schema)

```ts
{
  id: 'phy132',
  // ...
  pacing: {                              // NEW
    labsPerWeek: 1,
    suggestedCompletionWeeks: 14,
    // optional: weeklyCheckpoints: [{ week: 7, labs: [...] }]
  }
}
```

Both extensions belong in a single follow-up — see `docs/handoffs/` (todo: write the prereq-DAG handoff).

### Canvas / LMS integration

Canvas expects an ordered assignment list. A small generator script (`scripts/exportCanvasOrder.ts`) topologically sorts the prereq DAG (respecting `suggestedOrder` as tiebreaker) and emits a flat list. Canvas integration uses that list. Internal labframe UI continues to display the DAG.

## Per-legacy-lab decisions

| Legacy lab | Decision | Rationale |
|---|---|---|
| snellsLaw 132 | **Removed from PHY 132** | Optics doesn't belong in calc-based E&M. Course staying topic-focused. |
| snellsLaw 114 | **Kept, no split** | At edge of 90 min but coherent. Mystery materials A/B comparison defines the lab. |
| staticElectricity 132/114 | **Split into 2** | Parts 1A+1B (Travoltage + Balloons) are pure phenomenology; Parts 2A+2B (Coulomb's Law) are quantitative. Different pedagogical modes warrant separate sessions. |
| chargesFields 132/114 | **Split into 2** | Part 1A (E-field of point charge with three sub-experiments) is one full session. Part 1B (V vs r, V vs 1/r) + Part 2 (qualitative dipoles) is a second session. |
| capacitors 132 | **Split into 2** | Parts 1A-1C (fundamentals) is one session. Parts 2A+2B (sharing charges in parallel + series-parallel) is a second session. PHY 114 *already* effectively split by dropping 2A+2B. |
| capacitors 114 | **No split** | PHY 114 is just Parts 1A-1C; already 90-min sized. |
| dcCircuits 132 | **Split into 2 from legacy + 5 new labs (7 total)** | Parts 1A-1C → ohmsLaw. Parts 2A+2B → kirchhoffsLaws (with carried-forward Discussion). Plus five new labs: theveninsTheorem, rcCircuits, rcLowPassFilter, rlHighPassFilter, rlcBandpassFilter. |
| dcCircuits 114 | **Split into 2** | Parts 1A-1C → ohmsLaw. Part 2A → kirchhoffsLaws. (No Part 2B in PHY 114.) |
| magneticFieldFaraday 132 | **Split into 2** | Part 1 (bar magnet far-field, dipole moment) is one full session. Parts 2+3 (pickup coil + generator) is a second session. |
| geometricOptics 114 | **Split into 2** | Part 1 (converging lens) → convergingLens. Parts 2+3 (diverging lens + ray types) → divergingLensAndRays. |

## New PHY 132 lab manifest (15 labs, was 6)

Suggested order follows standard calc-based E&M textbook progression (Halliday/Resnick/Walker, Young/Freedman): charge → field → potential → capacitance → current → DC circuits → magnetism → induction → AC.

| # | Lab ID | Source | Prereqs |
|---|---|---|---|
| 1 | `staticChargingPhenomena` | legacy `staticElectricity` Parts 1A+1B | (none) |
| 2 | `coulombsLaw` | legacy `staticElectricity` Parts 2A+2B | `staticChargingPhenomena` |
| 3 | `electricFields` | legacy `chargesFields` Part 1A | `coulombsLaw` |
| 4 | `electricPotential` | legacy `chargesFields` Parts 1B+2 | `electricFields` |
| 5 | `capacitorFundamentals` | legacy `capacitors` Parts 1A+1B+1C | `electricPotential` |
| 6 | `capacitorsInCircuits` | legacy `capacitors` Parts 2A+2B | `capacitorFundamentals` |
| 7 | `ohmsLaw` | legacy `dcCircuits` Parts 1A+1B+1C | (none) |
| 8 | `kirchhoffsLaws` | legacy `dcCircuits` Parts 2A+2B (+ carried Discussion) | `ohmsLaw` |
| 9 | `theveninsTheorem` | **NEW** | `kirchhoffsLaws` |
| 10 | `rcCircuits` | **NEW** (time-domain RC: discharge, time constant) | `capacitorFundamentals`, `ohmsLaw` |
| 11 | `magneticDipoleField` | legacy `magneticFieldFaraday` Part 1 | (none) |
| 12 | `electromagneticInduction` | legacy `magneticFieldFaraday` Parts 2+3 | `magneticDipoleField`, `rcCircuits` |
| 13 | `rcLowPassFilter` | **NEW** (frequency-domain RC, gain across capacitor) | `rcCircuits`, `electromagneticInduction` |
| 14 | `rlHighPassFilter` | **NEW** (series RL, gain across inductor) | `rcLowPassFilter` |
| 15 | `rlcBandpassFilter` | **NEW** (series RLC, resonance, Q-factor) | `rlHighPassFilter` |

The filter sequence (13-15) intentionally goes after `electromagneticInduction` so students have already met inductors. The three filters together form a coherent capstone trio: each demonstrates one filter topology, and the discussion section of `rlcBandpassFilter` asks students to synthesize across all three.

## New PHY 114 lab manifest (10 labs, was 6)

| # | Lab ID | Source | Prereqs |
|---|---|---|---|
| 1 | `snellsLaw` | legacy `phy_114/snellsLaw` (full lab) | (none) |
| 2 | `staticChargingPhenomena` | same split as PHY 132 (no uncertainty fields) | (none) |
| 3 | `coulombsLaw` | same split as PHY 132 (no uncertainty fields) | `staticChargingPhenomena` |
| 4 | `electricFields` | same split as PHY 132 | `coulombsLaw` |
| 5 | `electricPotential` | same split as PHY 132 (no uncertainty fields) | `electricFields` |
| 6 | `capacitors` | legacy `phy_114/capacitors` (already lacks Parts 2A+2B) | `electricPotential` |
| 7 | `ohmsLaw` | legacy `phy_114/dcCircuits` Parts 1A+1B+1C (no uncertainty fields) | (none) |
| 8 | `kirchhoffsLaws` | legacy `phy_114/dcCircuits` Part 2A only | `ohmsLaw` |
| 9 | `convergingLens` | legacy `phy_114/geometricOptics` Parts 1A+1B (+ optional Part 4A converging) | (none) |
| 10 | `divergingLensAndRays` | legacy `phy_114/geometricOptics` Parts 2A+2B+3A (+ optional Part 4A diverging) | `convergingLens` |

## Cross-course shared content

Eight lab IDs appear in both courses and share the same content modulo the uncertainty-strip transformation: `staticChargingPhenomena`, `coulombsLaw`, `electricFields`, `electricPotential`, `ohmsLaw`, `kirchhoffsLaws`. The migration script's uncertainty-strip flag (per Stage 2 plan) handles the PHY 132 → PHY 114 transformation for all of these.

Course-specific:
- **PHY 132 only:** `capacitorFundamentals`, `capacitorsInCircuits`, `theveninsTheorem`, `rcCircuits`, `rcLowPassFilter`, `rlHighPassFilter`, `rlcBandpassFilter`, `magneticDipoleField`, `electromagneticInduction`
- **PHY 114 only:** `snellsLaw`, `capacitors` (un-split version), `convergingLens`, `divergingLensAndRays`

## New content scaffolds (PHY 132)

Five first-draft `.lab.ts` files exist at `src/content/labs/phy132/`:

- `theveninsTheorem.lab.ts` — Thevenin equivalent network reduction + verification (PhET CCK-DC)
- `rcCircuits.lab.ts` — Time-domain RC: discharge, time constant, log-linearization (PhET CCK-DC)
- `rcLowPassFilter.lab.ts` — Frequency-domain RC, V_out across capacitor → low-pass (PhET CCK-AC)
- `rlHighPassFilter.lab.ts` — Frequency-domain RL, V_out across inductor → high-pass (PhET CCK-AC)
- `rlcBandpassFilter.lab.ts` — Series RLC, V_out across resistor → bandpass; resonance, bandwidth, Q (PhET CCK-AC)

Each is a structurally complete draft against the existing `Lab` schema, with `TODO(austin)` markers where pedagogical decisions are needed. None will appear in a course manifest until you flip `enabled: true` after content review.

### Filter sequence design

The three filter labs are deliberately structured as a unit:

| Lab | Topology | V_out across | Filter type | Corner f |
|---|---|---|---|---|
| `rcLowPassFilter` | series RC | capacitor | low-pass | f_c = 1/(2πRC) |
| `rlHighPassFilter` | series RL | inductor | high-pass | f_c = R/(2πL) |
| `rlcBandpassFilter` | series RLC | resistor | bandpass | f_0 = 1/(2π√(LC)) |

The contrast is the point: capacitor reactance falls with f, inductor reactance rises with f. Each lab references the previous and asks students to predict the swap behavior. The bandpass capstone asks them to derive that the RLC peak occurs where ωL = 1/(ωC) — which they've already implicitly seen as the corner frequencies for RC and RL.

### Other rationale (carried from previous draft)

**Thevenin's Theorem** intentionally reuses the same 2-battery / 3-resistor network from legacy `dcCircuits` Part 2A. Students just analyzed that exact circuit via Kirchhoff in the preceding lab — direct comparison of methods makes the equivalence visceral.

**RC Circuits** (time-domain) anchors on log-linearization. ln(V) vs t is linear with slope -1/τ — the analytical payoff and a transferable skill (radioactive decay, Newton cooling, atmospheric pressure all use the same trick). Three (R, C) configurations let students see τ scales with both factors independently.

## Schema extensions deferred to agent handoffs

The new scaffolds surface three places where the current schema falls short. None block the scaffolds (they all have workarounds), but they should be addressed before the labs go live.

| Need | Used by | Handoff doc |
|---|---|---|
| Multi-series plots (one plot, multiple Y-series) | `theveninsTheorem` | `docs/handoffs/multi-series-plot-handoff.md` |
| Logarithmic axis support (log-x for frequency, optionally log-y for gain) | All three filter labs | `docs/handoffs/log-axis-support-handoff.md` |
| Prereq-DAG schema fields + pacing config + Canvas exporter | All courses | TODO — needs writing |

Each handoff doc is self-contained: an outside agent can pick it up cold, knows what to read, what to build, and what the acceptance criteria are.

## Decisions still to lock before Stage 2

1. **Existing `phy132/snellsLaw.lab.ts`.** Will be deleted (Snell's removed from PHY 132). Confirm before removal — it's the only lab with real migrated content right now.
2. **`phy114/snellsLaw.lab.ts`.** Per `LEGACY_PARITY_INVENTORY.md`, this file is currently a structural copy of PHY 132 with PHY 114 metadata. Must be regenerated from actual `phy_114/snellsLaw/` legacy source. Migration script Stage 2 handles this.
3. **PHY 132 dcCircuits Discussion bug — RESOLVED.** Per Austin: include the Discussion section in `kirchhoffsLaws.lab.ts`. Treating the legacy omission as a regression to fix.
4. **`objective` vs `q1` answer key — RESOLVED.** Normalize all labs to `objective`. Migration script will rename `q1` → `objective` in all carried-over content.
5. **Lab numbers — RESOLVED.** No fixed numbering. Prereq DAG + suggestedOrder hint.
6. **Schema extensions — RESOLVED.** Defer multi-series and log-axis to handoff prompts. Build alongside or after Stage 2.

Once the existing `phy132/snellsLaw.lab.ts` removal is confirmed, the proposal is locked. Stage 2 (migration script + per-lab migration) can begin.
