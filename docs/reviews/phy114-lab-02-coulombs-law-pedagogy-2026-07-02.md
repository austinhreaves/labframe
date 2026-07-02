# Pedagogy review: PHY 114 Lab 02 - Coulomb's Law

- **Lab id:** `coulombsLaw` (PHY-114-owned copy, `src/content/labs/phy114/coulombsLaw.draft.lab.ts`)
- **Course / lab number:** phy114 / 2 (`enabled: true`, `group: 'core'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-02-*.md` reference exists. Theory accuracy was
  reviewed from the lab's own Background blocks, which are correct: Coulomb's law, the
  value of $k$, $1\,\mathrm{e} \approx 1.602 \times 10^{-19}\,\mathrm{C}$,
  $1\,\mathrm{pm} = 10^{-12}\,\mathrm{m}$, the Bohr radius scale note, and both slope
  derivations ($A = k|Q_1|/d^2$ in 2A; $k|Q_1 Q_2| = A$ in 2B) all check out. Write the
  theory doc so Canvas has a matching reference.

### A2. Units

- **[concern]** Sections 14 and 30 (`forceChargeSlopeA`, `forceDistanceSlopeA`). Both fit
  slopes are recorded in a bare `$A =$` field with no unit and no place to record one.
  This is the known systemic fit-units gap, and it bites hardest here: the entire
  Calculation step that follows is a unit-conversion exercise on $A$, yet the student
  never states what units their $A$ carries (2A: force-unit per e; 2B: force-unit times
  pm squared). Add an explicit units field (or a labeled pair "value / units") for each
  slope reading.
- **[concern]** Sections 10 and 24 (data tables) and the y-axes of all four plots. The
  force column is deliberately unit-free because the sim picks an SI submultiple, and the
  instructions say "note the unit it gives you and stay consistent" - but the worksheet
  gives the student nowhere to note it. The recorded data is uninterpretable afterwards
  (and ungradeable for unit correctness). Add a short field per part: "Force unit shown
  by the sim: \_\_\_", or make the force column header a fillable unit.
- **[suggestion]** Section 24. The derived column headers `Inverse Distance $(1/d)$` and
  `$(1/d^2)$` omit their units ($1/\mathrm{pm}$, $1/\mathrm{pm}^2$) even though the
  corresponding plot axes state them. Add the units to the column labels so table and
  plot agree.

### A3. PER alignment

- **[concern]** The lab elicits no committed prediction anywhere. Two cheap, high-value
  insertion points: before section 6 (2A data collection), "predict: if $Q_2$ doubles,
  what happens to $F$?"; and before section 22 (2B), "predict which of the three plots
  ($F$ vs $d$, $F$ vs $1/d$, $F$ vs $1/d^2$) will be a straight line." Note the current
  section 18 Background pre-announces the 2B answer ("plot the ones... the linear one is
  the relationship that holds"), which turns Part 2B into pure confirmation; a prediction
  field before that reveal would restore the test.
- **[concern]** Both calculation steps end at "compute the percent error." No prompt asks
  the student to account for the discrepancy. The 132 parent handled this through its
  uncertainty clauses, which were correctly stripped for 114, but nothing algebra-based
  replaced them. Add one line to each calculation (or one concept field per part): "state
  the most likely reason your $k$ differs from the accepted value" (sim readout
  resolution, rounding in $1/d^2$, fit quality are all reachable answers without error
  propagation).

### B4. Scaffolding

- **[suggestion]** Section 36 (discussion prompt) asks students to "draw parallels
  between Newton's Law of Gravitation and Coulomb's Law," which is never mentioned
  earlier in the lab. As a transfer question this is defensible for students who took
  mechanics, but one sentence in the section 2 Background ("compare the form of this law
  to Newton's law of gravitation, which you saw last semester") would set it up.

### B5. Clarity and cognitive load

- **[suggestion]** Sections 12 and 28 offer both "Linear (y = mx + b)" and "Proportional
  (y = mx)" fits while the instructions require the proportional one. Students who pick
  the linear fit will read off an $A$ with a nonzero intercept and a slightly different
  slope. Either remove the linear option from these two plots or add a half-sentence
  saying what the linear fit is there for (e.g. checking that $b \approx 0$).

### B6. Course register

No findings. The uncertainty stripping documented in the file header is complete in the
body; percent error is retained (correct for 114); no calculus language; the unit-prefix
and scientific-notation demands are algebra-appropriate and well scaffolded by the
conversion callouts.

## Solid

- The "note on units" Background (section 2) is exactly the right just-in-time treatment
  of $\mathrm{e}$ and $\mathrm{pm}$, including the Bohr-radius anchor for scale.
- The three-plot inverse-square discrimination ($F$ vs $d$, $1/d$, $1/d^2$) is the
  strongest methodological element in the lab: it rules out the $1/d$ alternative rather
  than just asserting $1/d^2$.
- Both calculation callouts (set the fit equation equal to Coulomb's law, then convert
  units) scaffold the algebra without doing it for the student.
- Extracting $k$ twice by independent routes and comparing both to the accepted value is
  good measurement practice and sets up the discussion naturally.
