# Pedagogy review: PHY 114 Lab 07 - Continuity & Ohm's Law

- **Lab id:** `ohmsLaw` (PHY-114-owned copy, `src/content/labs/phy114/ohmsLaw.draft.lab.ts`)
- **Course / lab number:** phy114 / 7 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-07-*.md` reference exists. The in-lab physics is
  otherwise correct: $V = IR$ and its forms, ohm = volt/ampere, slope of $I$-vs-$V$ as
  $1/R$, the filament-heating mechanism for the bulb's decreasing slope, and the
  series-combination logic behind extracting $R_p$ from the Part 1B slope.
- **[suggestion]** Section 2 says conductivity is a property of a material and calls
  resistance "the inverse property." Strictly, conductivity's inverse is resistivity
  (material properties), while resistance's inverse is conductance (object properties);
  the sentence conflates the two levels. A one-word swap to "resistivity," or rewording
  to "how much an object opposes the flow," keeps it clean without adding formalism.

### A2. Units

- **[concern]** Section 7 (`V =`, `I =`), sections 14 and 26 (`Known resistance R =`):
  no units on any of these fields (volts, amperes, ohms), while the data tables and plot
  axes in the same lab carry units correctly. Add `unit:` values.
- **[concern]** Sections 22 and 34 (`A =`): both slope readings are bare fields with no
  units and nowhere to record them - the systemic fit-units gap. It is partially
  mitigated here because the section 23 calculation _asks_ "what are the units of the
  slope?", which is good pedagogy, but the answer should also land on the recorded slope
  itself. Add a units field next to each `A =`.

### A3. PER alignment

- **[concern]** No committed predictions. Part 1A is the cheapest, highest-value fix in
  the whole course: before each of the three trials (sections 8-10), students should
  predict conductor / insulator / in-between and what the fuse will do; the eraser,
  paper clip, and pencil are exactly the objects intro students hold wrong intuitions
  about. One compact prediction field before procedure step 4 ("classify each object
  before you test it") converts three observations into three tests.
- **[suggestion]** Part 1C: the section 11 Background reveals the bulb's curve bends
  before students take the data. Consider deferring the "the curve bends" paragraph to
  after Part 1C data collection, or adding a quick shape-prediction field before the
  sweep; as shipped, 1C confirms an announced result.

### B4. Scaffolding

No findings. The continuity-to-ohmic-to-non-ohmic arc builds correctly; the Part 1C
slope-interrogation questions (whole-graph slope vs. low- and high-voltage sections) are
the strongest concept-check set in the course so far and land after all needed data
exists.

### B5. Clarity and cognitive load

- **[concern]** Sections 4, 13, 25 rest circuit values and topology on "the Set of
  Parameters," which does not exist in the app (same randomized-givens hold as Labs
  04-06). It matters here because the Part 1A behavior students must explain (fuse
  blowing with the paper clip, current change with the pencil) depends on whether the
  test branch shorts the known resistor or sits in series with it; the prose alone
  ("a second branch") leaves that ambiguous. Until givens ship, add a reference
  schematic or one clarifying sentence on the branch topology.

### B6. Course register

No findings. The uncertainty stripping documented in the file header is complete in the
body; no calculus language; the units-of-slope reasoning in the calculation prompt is
algebra-appropriate.

## Solid

- Part 1A's everyday-objects continuity test is a strong concrete anchor, and the fuse
  gives the "too much current" case a visible consequence.
- Using the pencil (a resistive but ohmic object) in 1B and the real bulb in 1C gives a
  clean ohmic/non-ohmic contrast with the same circuit skeleton.
- The double fit (proportional and linear "should be nearly indistinguishable") in 1B
  quietly teaches what a zero intercept means, and reusing both fits on the 1C curve
  lets students watch a model fail.
- The slope-section questions (sections 37-38) push students to see resistance as a
  local slope property rather than one number - the exact conceptual payoff of a
  non-ohmic lab.
