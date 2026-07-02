# Pedagogy review: PHY 132 Lab 08 - Kirchhoff's Laws & Power

- **Lab id:** `kirchhoffsLaws` (PHY-132-owned,
  `src/content/labs/phy132/kirchhoffsLaws.draft.lab.ts`)
- **Course / lab number:** phy132 / 8 (`enabled: true`, `group: 'core'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md`
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Related:** the 2026-07-02 phy114 reviews of the same content; this report reviews
  the 132 register after the powerTransfer fit landed.
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No matching `docs/theory/` reference exists. The in-lab physics is
  correct (see the phy114 review of the same content for the full check: KCL/KVL,
  internal-resistance model, eq (13) limits, Stereo System numbers). The previously
  blocking fit-implementability defect is resolved: the Part 2B plot's `powerTransfer`
  fit is implemented app-wide, step 5 matches the UI, and the parameter rows carry
  units. Verified in the browser on this course's route.

### A2. Units

- **[concern]** The eleven Part 2A multiMeasurement rows (EMFs, resistances, branch
  currents, resistor voltages) carry no units (V, Ω, A), while the Part 2B table, plot
  axes, and the new $A$/$B$ rows are fully labeled.

### A3. PER alignment

- **[suggestion]** Add a peak-location prediction before the 2B sweep, and a
  discrepancy-explanation clause after the $\varepsilon$ and $r$ percent errors. For
  132 specifically, the fit summary reports 1-sigma parameter uncertainties; a natural
  register-appropriate upgrade is to ask whether the set values fall within one or two
  sigma of the fitted $A$ and $B$, making the uncertainty a decision tool (rubric A3)
  rather than a read-off.

### B4. Scaffolding

No findings. Verify (2A), model (2B), derive (calculus derivation, appropriate for
132), transfer (Stereo System).

### B5. Clarity and cognitive load

- **[concern]** "Set of Parameters" references are dangling pending randomized givens,
  and Part 2A step 1 references a diagram that does not exist. Same remediation as the
  phy114 report: a reference schematic image is the highest-value fix.
- **[suggestion]** Renumber the lone equation tag (13).

### B6. Course register

No findings. The calculus maximum-power-transfer derivation is appropriate here (132 is
calculus-based); uncertainty appears via the fit's 1-sigma errors, and the A3 suggestion
above would make it load-bearing.

## Solid

- Everything in the phy114 report's Solid list applies, plus: keeping the symbolic
  $dP_R/dR$ derivation alongside the empirical fit gives 132 students both routes to
  $R = r$, which is exactly the right register difference from the 114 fork.
