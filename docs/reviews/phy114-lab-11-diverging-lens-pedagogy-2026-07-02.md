# Pedagogy review: PHY 114 Lab 11 - Diverging (Concave) Lens

- **Lab id:** `divergingLens` (PHY-114-owned,
  `src/content/labs/phy114/divergingLens.draft.lab.ts`)
- **Course / lab number:** phy114 / 11 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-11-*.md` reference exists and, like the companion
  Converging Lens lab, there is no in-lab Background block ("structure first, enrich
  later" per the file header). The physics that does appear is correct, but the sign
  story is incomplete exactly where a diverging lens needs it most: step 3 correctly
  warns that the virtual image has negative $d_i$, yet nothing tells students that the
  focal length they compute in section 13 should come out **negative**, and the Part 4A
  lens-maker comparison will only match if the sign conventions (negative $f$, and the
  RoC sign for a concave lens) are handled consistently. When the enrichment Background
  is written, lead with the diverging-lens sign conventions.

### A2. Units

- **[concern]** Sections 3 and 11: RoC, D, $d_0$, $d_i$, $h_0$, $h_i$ all lack units
  (cm); only $n$ is correctly unitless. Same fix as Lab 10: `unit: 'cm'` on the rows.

### A3. PER alignment

- **[concern]** Two gaps, mirroring Lab 10. First, the single best prediction moment in
  the optics sequence is unused: students arrive here straight from the converging lens,
  so ask before Part 2A, "based on the converging lens, predict: will a diverging lens
  ever form a real image? Ever an inverted one?" - then the observations test it (and
  the existing section 8 concept check becomes the comparison). Second, the core lab
  never compares the experimental $f$ to anything; the percent-error loop exists only in
  optional extra credit. Add a core comparison against the sim's labeled focal length.

### B4. Scaffolding

No findings. Qualitative-then-quantitative, then the ray-types part revisiting both
lenses, is a sound order; the "always same side / always upright / always smaller"
observations in 2A set up the virtual-image concept check well.

### B5. Clarity and cognitive load

- **[concern]** Section 19 (Part 4A): "Using the Lens-Maker Equation from the lab
  manual" - the equation is never stated in the app, and "the lab manual" is not a
  resource LabFrame students have in front of them. One line stating the equation (with
  the concave-lens sign convention) makes the extra credit self-contained; otherwise
  point at the actual Canvas location.
- **[suggestion]** Part 4A also depends on the experimental focal length from the
  companion Converging Lens lab; add a reminder to have that report handy, since the
  student may be resuming days later.
- **[suggestion]** Same formatting polish as Lab 10: `d<sub>₀</sub>` double subscripts,
  the all-caps "DISCUSSION & CONCLUSION" heading, and the image section reusing one id
  for `imageId` and `captionFieldId` (`part2B_screenshot`); rename the caption id.

### B6. Course register

No findings. No uncertainty or calculus content; percent error in the extra credit is
114-appropriate.

## Solid

- The observation questions correctly steer students to the diverging lens's three
  invariants (same side, upright, reduced) rather than a parameter sweep with no
  pattern.
- Part 3A's many/principal/marginal comparison is a genuinely good conceptual exercise
  ("how many paths can light take?") that most intro optics labs skip.
- The magnification double-check with a stop-and-ask mismatch gate carries over from
  Lab 10, and the extra-credit percent-error loop is the right shape (it just needs to
  exist in the core lab too).
