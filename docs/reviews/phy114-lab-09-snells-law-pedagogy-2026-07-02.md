# Pedagogy review: PHY 114 Lab 09 - Snell's Law

- **Lab id:** `snellsLaw` (PHY-114-owned, `src/content/labs/phy114/snellsLaw.lab.ts`)
- **Course / lab number:** phy114 / 9 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-09-*.md` reference exists. The in-lab physics is
  correct throughout: $n = c/v$ with the $n \geq 1$ note, the law of reflection, Snell's
  law, the slope identity (with refracted-sine on y, the slope is $n_1/n_A$ - checked
  against the axis assignment, it is right), and the critical-angle relation
  $\theta_c = \arcsin(n_2/n_1)$ applied in the correct direction (Mystery A above,
  Mystery B below, and PhET's Mystery A does have the higher index, so total internal
  reflection actually occurs as scripted).
- **[suggestion]** Section 22 uses "denser medium / less dense" for the $n_1 > n_2$
  condition. Mass density and optical density diverge for real materials; say "optically
  denser (higher $n$)" once to keep the shorthand honest.

### A2. Units

No findings. This is the unit-cleanest lab in the course: angle columns and the critical
angle field carry `deg`, the sine columns and slope are genuinely dimensionless (the
dimensionless exception applies, so the bare `A (slope)` fields are correct here), and
the indices of refraction are correctly unitless.

### A3. PER alignment

- **[concern]** No committed predictions. Two natural insertion points: Part 1's concept
  check already asks "Is this what you expected?" after the fact - convert it by adding a
  short pre-measurement field ("before measuring: how do you expect the reflected angle
  to compare to the incident angle?"); and before Part 4, ask "given $n_A$ and $n_B$ from
  Parts 2-3, in which direction (A into B, or B into A) do you expect total internal
  reflection, and roughly at what angle?" The second one is especially strong because
  students have the numbers to make a quantitative prediction from Eq. (4).
- **[suggestion]** Section 28 computes the percent difference between the two $n_A$
  determinations but never asks which measurement the student trusts more or why the two
  differ. One clause turns the consistency check into reasoning.

### B4. Scaffolding

No findings. Known media, then unknown A, then unknown B, then a cross-method
consistency check is an exemplary arc, and concept checks 1-3 (can $n < 1$? why does TIR
need $n_1 > n_2$? what if $n_1 = n_2$?) are proper limiting-case sense-making placed
after all the data exists.

### B5. Clarity and cognitive load

- **[concern]** Part 1 steps 3 and 5 and Part 2 step 1 reference "your parameter set"
  for $n_1$, $n_2$, and the Part 1 incident angles; no parameter set exists in the app
  (Parts 2-3 inline their angles, so only these values dangle). Same
  randomized-givens hold as Labs 04-08; smallest interim fix here is to inline a default
  $n_1$/$n_2$ and Part 1 angle list, since nothing in this lab's design depends on
  per-student variation.
- **[suggestion]** Notation and formatting polish: the Background heading renders as
  "Background:" with a trailing colon and no title; equations are plain bold text
  (`n = c / v`, `theta_1`) where every other lab uses LaTeX; and the derived sine
  columns' `label` / `formulaLabel` pairs disagree (`sin(theta_1)` vs `sin(theta_i)`,
  `sin(theta_A)` vs `sin(theta_r)`). None of these block, but together they make this
  lab read as a different product from Labs 01-08.

### B6. Course register

No findings. No uncertainty or calculus content; arcsin and percent difference are
algebra-appropriate.

## Solid

- Measuring $n_A$ two independent ways (sin-sin slope, then critical angle) and
  computing a percent difference is the best consistency-check design in the course.
- The derived sine columns keep students focused on the physics while still showing the
  linearization explicitly.
- The mystery-material framing makes Parts 2-3 genuine measurements rather than
  confirmations - students cannot look up the answer.
- Units discipline throughout is the model the other labs should copy.
