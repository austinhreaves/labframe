# Pedagogy review: PHY 114 Lab 03 - Electric Field & Potential of a Point Charge

- **Lab id:** `pointCharge` (PHY-114-owned copy, `src/content/labs/phy114/pointCharge.draft.lab.ts`)
- **Course / lab number:** phy114 / 3 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-03-*.md` reference exists. Reviewed from the lab's own
  Background blocks, whose physics is correct: $E = F/q_{\text{test}}$, N/C equivalent to
  V/m, $E = k|q|/r^2$, $V = kq/r$ with the $V \to 0$ at infinity convention, and the
  expected slope $kq$ for the $V$-vs-$1/r$ fit all check out.

### A2. Units

- **[concern]** Sections 5, 15, 20, 26 (bare `label` measurement fields: `Charge q =`,
  `Sensor distance r =`, `Charge q =`) and the Part 1A data tables (sections 9, 16, 21:
  `Measured E`, `Calculated E`, `Charge`, `Field strength E`, `Distance`). None of these
  carry units or give the student a place to record one, in contrast to Lab 2 where the
  equivalent rows carry `unit: 'e'` / `unit: 'pm'`. The sim reads charge in nC, distance
  in m, and field in V/m; the worksheet should say so (add `unit:` to the rows and units
  to the column labels).
- **[concern]** Section 35 (`slopeValue`, `Slope m =`). The known fit-units gap: the slope
  of $V$ vs $1/r$ carries V·m, the following calculation compares it against $kq$ in SI,
  and there is nowhere to record the slope's units. Add an explicit units field or fold
  the unit into the label.
- **[suggestion]** Section 30/31/33: the `Electric Potential V` column and the plot y-axis
  label `V` use the symbol as the label, so "V" reads as both quantity and unit. Label as
  `Potential V (V)` / y-axis `V (V)`; also add `(1/m)` to the derived `1/r` column header
  to match the plot's x-axis.

### A3. PER alignment

- **[concern]** The section 2 Background explicitly promises predictions: "(b) by doubling
  $q$ at fixed $r$ and **predicting** how $E$ changes; (c) by doubling $r$... **predicting**
  how $E$ changes." But Parts 1A(b) and 1A(c) (sections 13-22) contain no prediction
  field; students measure first, then section 17/22 asks whether the result "agrees with
  the prediction of equation (3)" - a prediction they never committed. Add a one-line
  prediction field before each doubling measurement; the lab already has the right
  after-the-fact comparison prompts to close the loop.
- **[concern]** Sections 11 and 37 end at percent error with no prompt to account for the
  discrepancy. Add an algebra-appropriate "most likely reason your value differs" line
  (sensor placement off a grid point, readout rounding, ring drawn slightly off the target
  radius).

### B4. Scaffolding

- **[concern]** Section 12 (`qualitativeObservations`) asks "what happens to the magnitude
  of the electric field as you move the sensors closer to or farther from the charge" -
  but Part 1A(a)'s procedure places all four sensors at one fixed $r$; distance variation
  does not happen until 1A(c). The concept check is asking about data the student does not
  have yet. Either trim this prompt to direction and symmetry (which 1A(a) does produce)
  or move the closer/farther clause into the 1A(c) concept check.

### B5. Clarity and cognitive load

- **[concern]** Sections 4 and 25 both instruct "(see Set of Parameters)" for the values
  of $q$ and $r$, but no Set of Parameters (or Givens callout) exists anywhere in this
  lab. This is an orphaned reference to the source manual's parameter box, and it leaves
  students with no assigned values. Add a Givens callout per part (the house style used in
  Lab 2) or reword to "choose a charge and distance and record them below."
- **[suggestion]** Equations are numbered (3) and (6) with no equations (1), (2), (4), or
  (5) in the lab - inherited numbering from the source manual. Renumber to (1) and (2)
  and update the four prompts that cite them.
- **[suggestion]** The fit slope is named $m$ (section 35) in a lab where $\mathrm{m}$
  (meters) appears in adjacent labels and axes. Consider naming it $A$ as Lab 2 does.

### B6. Course register

- **[concern]** Section 23 Background derives $V = kq/r$ via "integrating
  $\vec{E}\cdot d\vec{r}$ from infinity inward (taking $V \to 0$ as $r \to \infty$)".
  That is calculus language in an algebra-based course; PHY 114 students have not seen
  integrals or dot-product differentials. State the result instead ("for a point charge,
  the potential relative to far away turns out to be $V = kq/r$; you will see where this
  comes from in a calculus-based course") and keep the $1/r$-vs-$1/r^2$ contrast, which
  is the part students actually use.

No uncertainty content (the stripping documented in the file header is complete).

## Solid

- The three-way verification structure of Part 1A (absolute comparison at fixed $r$, then
  the two controlled doublings) is an excellent controlled-variables design.
- The $V$-vs-$r$ curve shown before the $V$-vs-$1/r$ linearization, with concept checks on
  each, cleanly separates "it is not linear in $r$" from "it is linear in $1/r$".
- The explicit contrast "this is _not_ an inverse-square relationship" heads off the most
  common $E$/$V$ conflation directly.
- Percent error is used consistently as the comparison tool, matching the 114 register.
