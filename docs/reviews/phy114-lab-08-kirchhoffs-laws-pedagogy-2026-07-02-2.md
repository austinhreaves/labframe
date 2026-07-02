# Pedagogy review: PHY 114 Lab 08 - Kirchhoff's Laws & Power (re-review)

- **Lab id:** `kirchhoffsLaws` (now a PHY-114-owned fork,
  `src/content/labs/phy114/kirchhoffsLaws.draft.lab.ts`)
- **Course / lab number:** phy114 / 8 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 (same-day re-review after fixes) / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md`
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Prior review:** `phy114-lab-08-kirchhoffs-laws-pedagogy-2026-07-02.md` (blocked, on
  the shared 132 object)
- **Verdict:** needs-work

## Changes since the prior review

Both blockers are **cleared**:

1. **A1 (fit not implementable):** the app now implements the `powerTransfer` fit
   (`src/services/math/powerTransferFit.ts`: seeded damped Gauss-Newton minimizing
   P-space residuals, 1-sigma errors from the covariance matrix; sampled curve rendering
   in the chart and the PDF; unit- and integration-tested against independently verified
   reference values). The Part 2B plot offers exactly this fit, procedure step 5 matches
   the actual UI, and the $A$/$B$ recording rows now carry their units (V², Ω), which
   also closes the prior A2 fit-units finding for these fields. Verified end to end in
   the browser: filling the table and selecting the fit recovers A = 36.00, B = 3.000
   with a smooth sampled curve and a correct legend.
2. **B6 (calculus derivation):** PHY 114 now gets its own fork (established
   coulombsLaw/pointCharge/ohmsLaw pattern). The `maximumPowerTransferDerivation`
   calculus block is replaced by `maximumPowerTransferReading`: read the peak off the
   $P_R$ vs $R$ plot, compare to $r$ and to the fit parameter $B$, state the $R = r$
   rule, and check $\varepsilon^2/(4r)$ against the observed peak power. The Background
   and Stereo System cross-references were updated to match, and the step 5 wording
   drops the 1-sigma reading clause in the 114 register. The 132 original keeps its
   calculus derivation. Verified in the browser that the phy114 route serves the fork.

## Findings (carried from the prior review, unchanged)

- **[concern, A1]** No `docs/theory/lab-08-*.md` reference exists.
- **[concern, A2]** The eleven Part 2A multiMeasurement rows (EMFs, resistances, branch
  currents, resistor voltages) still carry no units.
- **[concern, B5]** "Set of Parameters" references remain dangling, and Part 2A step 1
  still says "label your branch currents... on the diagram" with no diagram.
- **[suggestion, A3]** No peak-location prediction before the 2B sweep; percent errors
  still lack a discrepancy-explanation clause.
- **[suggestion, B5]** The power equation is still tagged (13), the only numbered
  equation in the lab.

## Verdict rationale

No blockers remain. The fork is completable by algebra-based students and the fit is
real. The carried concerns (units, dangling parameters, missing schematic) keep the
verdict at needs-work.
