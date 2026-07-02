# Pedagogy review: PHY 114 Lab 08 - Kirchhoff's Laws & Power

- **Lab id:** `kirchhoffsLaws` (shared PHY 132 object,
  `src/content/labs/phy132/kirchhoffsLaws.draft.lab.ts`, reviewed under the PHY 114
  register)
- **Course / lab number:** phy114 / 8 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** blocked

## Findings

### A1. Theory accuracy

- **[blocker]** Sections 20-21 (Part 2B procedure step 5 and the `customFitA`/`customFitB`
  fields). The procedure instructs students to "fit your data to the model
  $P_R = A \cdot R/(R+B)^2$" and read off the best-fit $A$ and $B$, but the app's chart
  component implements only `linear` and `proportional` fits
  (`src/ui/primitives/Chart.tsx`), and this plot's `fits` array offers exactly those two.
  The instructed fit does not exist, so the two fields and the three downstream
  calculations that depend on them ($\varepsilon_{\text{exp}} = \sqrt{A}$, $B = r$
  percent errors) cannot be completed as written. This affects PHY 132 identically.
  Remediation: either implement a custom-model fit for this plot, or rewrite step 5 to
  an achievable extraction (read the peak power and its location $R_{\text{peak}}$ off
  the plot; compare $R_{\text{peak}}$ to $r$; estimate $\varepsilon$ from the terminal
  voltage at large $R$ or from $P_{\text{max}} = \varepsilon^2/4r$).
- **[concern]** No `docs/theory/lab-08-*.md` reference exists. In-lab physics is
  otherwise correct and well stated: KCL/KVL with sign conventions, the independence
  counts ($N-1$ junction equations, two loop equations), the internal-resistance model,
  $P_R = \varepsilon^2 R/(R+r)^2$ with correct limiting behavior, and the Stereo System
  numbers all check out (max power at $R = r = 4\,\Omega$, $\eta = 50\%$; at
  $36\,\Omega$: 12.96 W of 14.4 W, $\eta = 90\%$).

### A2. Units

- **[concern]** Sections 7 and 9: none of the eleven multiMeasurement rows (EMFs,
  resistances, branch currents, resistor voltages) carry units (V, Ω, A), while the Part
  2B table and plot axes in the same lab are fully unit-labeled. Add `unit:` values.
- **[concern]** Section 21 (`A =`, `B =`): the fit-parameter fields have no units and
  nowhere to record them - the systemic gap, aggravated here because $A$ carries the
  non-obvious unit $\mathrm{V}^2$ (it equals $\varepsilon^2$) and $B$ carries Ω. If the
  step is rewritten per the A1 blocker, give whatever replaces these fields explicit
  units.

### A3. PER alignment

- **[suggestion]** Before the Part 2B sweep, ask students to predict where the power
  curve peaks (below, at, or above $R = r$). The Background already reveals the shape
  but not the peak location, so this prediction is still live, and it sets up the
  maximum-power result.
- **[suggestion]** The $\varepsilon$ and $r$ comparisons end at percent error; add a
  "most likely cause of the discrepancy" clause (wire resistance not exactly zero, meter
  loading).

### B4. Scaffolding

No findings. Verify-the-laws (2A), then apply-the-model (2B), then transfer (Stereo
System) is the right arc, and part (d) of the stereo problem (power vs. efficiency
tradeoff) is a genuinely good synthesis question.

### B5. Clarity and cognitive load

- **[concern]** Sections 4 and 14 depend on "the Set of Parameters," which does not
  exist in the app (same randomized-givens hold as Labs 04-07). The two-loop topology in
  2A is described in words, but step 1 also says "label your branch currents... on the
  diagram" - there is no diagram. A reference schematic image for the two-loop circuit
  is the single best fix for this part.
- **[suggestion]** The power equation is tagged (13) - the only numbered equation in the
  lab, inherited from the source manual. Renumber to (1) and update the three prompts
  that cite it.

### B6. Course register

- **[blocker]** Section 24 (`maximumPowerTransferDerivation`): "**Use calculus** to find
  the theoretical prediction for the condition for maximum power transfer... what should
  $dP_R/dR$ equal at the location of the maximum?" This is a required 2-point symbolic
  differentiation task in an algebra-based course. Escalation justification: this is not
  incidental calculus vocabulary; it is a task PHY 114 students have not been taught the
  operation to perform, so the section is impossible for the intended audience.
  Remediation: this cannot be fixed in the shared object without damaging PHY 132
  (where the derivation is appropriate); fork a PHY-114-owned copy (the established
  pattern used for `coulombsLaw`, `pointCharge`, `ohmsLaw`) that replaces the derivation
  with an empirical version: "From your plot, at what load resistance is the delivered
  power maximum? Compare this to the internal resistance $r$ you set. State the general
  rule your data suggest."

## Solid

- The KCL/KVL verification in Part 2A, with explicit signed-value guidance ("if the
  meter reads negative, your assumed direction was wrong - record the signed value"),
  teaches reference directions properly.
- The 15-point load sweep with a dense cluster around the expected peak and sparse tail
  (1.0-10.0, then 20, 40 Ω) is well-designed sampling.
- The derived power column ($P = V \cdot I$) keeps arithmetic out of the student's way
  at exactly the right place.
- The Stereo System problem is an excellent applied capstone, and its part (d)
  power-vs-efficiency question lands the lab's central tradeoff.
