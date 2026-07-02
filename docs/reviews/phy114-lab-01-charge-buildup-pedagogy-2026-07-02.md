# Pedagogy review: PHY 114 Lab 01 - Charge Buildup

- **Lab id:** `chargeBuildup` (PHY-114-owned copy, `src/content/labs/phy114/chargeBuildup.lab.ts`)
- **Course / lab number:** phy114 / 1 (`enabled: true`, `group: 'core'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** `docs/theory/lab-01-charge-buildup.md`
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** Section 2 (`## Background: How Charge Imbalances Form`, mechanism 3) and
  theory doc lines 45-51. Both state that after induction "the conductor retains a net
  charge **opposite** to the inducing object." That is correct for the ground-and-disconnect
  case, but for the split-conductor case (which is exactly what Part 1C's two-can
  simulation does) only the piece **nearer** the rod ends up opposite; the far piece ends
  up with the **same** sign, and the two-piece system stays at zero net charge by
  conservation. The lab then asks `inductionChargeSignQuestion` (section 16), whose correct
  answer contradicts the Background as written. Fix **both artifacts**: qualify the split
  case (near piece opposite, far piece same sign, total conserved). This is also a missed
  chance to reinforce the Conservation of Charge block taught in section 7.
- **[suggestion]** Section 2, mechanism 2. "When a charged object physically contacts a
  conductor" is looser than the theory doc's "when a charged conductor touches another
  conductor." A charged insulator (the balloon) does not share charge by contact the way a
  conductor does, and students just spent Part 1B holding a charged balloon against things.
  Align the lab wording with the doc.

### A2. Units

No findings. The lab is fully qualitative: no numeric fields, tables, plots, or fits.

### A3. PER alignment

- **[concern]** Part 1C, before section 15 (`twoCansOrderObservation`). The lab never
  elicits a committed prediction anywhere, and procedure step 2 ("Order matters: remove
  the rod first") is the natural place for one: students should record what they expect
  the final can charges to be **before** running the reversed sequence. Add a short
  prediction field (concept, 0.5 pt) ahead of the step 2 run; the existing
  `inductionOrderQuestion` (section 17) then becomes genuine discrepancy reasoning against
  their own prediction rather than post-hoc explanation.
- **[suggestion]** Part 1B, before section 8 (balloon near wall). A second cheap
  prediction slot: "will the charged balloon attract, repel, or ignore the neutral wall?"
  This is the classic polarization misconception probe and costs one field.

### B4. Scaffolding

No findings. Observe, then identify mechanism, then explain, then synthesize; the
five-scenario mapping (`mechanismSummaryQuestion`) lands after all data exists, and its
escape hatch ("if a scenario does not cleanly match any of the three") correctly
anticipates that scenario (d) is polarization, not one of the three charging mechanisms.

### B5. Clarity and cognitive load

No findings. Backgrounds introduce at most three concepts each, procedure steps are
single-action, and every referenced observation exists.

### B6. Course register

- **[suggestion]** Section 2, mechanism 1. "Electron donor (low electronegativity)" and
  "electron acceptor (high electronegativity)" drop an undefined chemistry term into the
  first page; triboelectric ordering does not strictly track electronegativity anyway.
  The theory doc's phrasing ("hold onto electrons with different strengths") is both more
  accurate and register-appropriate. Use it.

No uncertainty or calculus content present (correct for PHY 114).

## Solid

- The three-simulation parts structure (1A/1B/1C) maps one phenomenon per sim cleanly.
- The order-matters contrast in Part 1C (steps 1 vs 2) is genuinely good experiment
  design: same actions, different order, different outcome.
- The polarization-vs-induction Background (section 14) is placed just in time, after
  students have seen the wall behavior it explains and before the can sim that contrasts
  with it.
- The Discussion tail (summary, personally encountered example, most-surprising) closes
  with transfer and metacognition rather than recall.
