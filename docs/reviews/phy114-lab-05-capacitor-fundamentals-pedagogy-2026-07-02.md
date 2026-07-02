# Pedagogy review: PHY 114 Lab 05 - Capacitor Fundamentals

- **Lab id:** `capacitorFundamentals` (shared PHY 132 object,
  `src/content/labs/phy132/capacitorFundamentals.draft.lab.ts`, reviewed under the PHY 114
  register)
- **Course / lab number:** phy114 / 5 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** blocked

## Findings

### A1. Theory accuracy

- **[blocker]** Sections 2 and 37 (and the discharge steps at 10, 25, 30). The lab frames
  the lightbulb discharge time as "a qualitative proxy for the stored energy," and the
  discussion prompt asks "what the discharge-time observations imply about stored
  energy." The physics says the opposite in exactly the manipulations this lab performs.
  Discharge time tracks the RC time constant, i.e. the capacitance, not the energy:
  - Part 1B (battery disconnected, $d$ increased): $C$ falls, so the discharge is
    _faster_, while $U = \tfrac{1}{2}Q^2/C$ _rises_. Shorter bulb time, more energy.
  - Part 1C (battery disconnected, $A$ increased): $C$ rises, so the discharge is
    _slower_, while $U$ _falls_. Longer bulb time, less energy.
    A student with correct data and correct concept-check answers will find their
    discharge-time "energy proxy" contradicting their own $U$ reasoning, and the discussion
    prompt pushes them to resolve it the wrong way. Remediation: drop the energy-proxy
    claim; keep the discharge observations (they are good data) but reframe them as
    evidence about capacitance ("a smaller capacitor drains faster") and initial brightness
    as evidence about voltage ($V$ rose in 1B, so the bulb flashes brighter). Update the
    section 37 discussion clause accordingly. Because this object is shared, the same fix
    lands in PHY 132's lab 5.
- **[concern]** No `docs/theory/lab-05-*.md` reference exists. The in-lab Background
  physics is otherwise correct: $C = \varepsilon_0 A/d$, $Q = CV$, the three energy
  forms, and both held-$V$ / held-$Q$ analyses all check out, including the work-done
  remark for plate separation.

### A2. Units

- **[concern]** Sections 5, 15, 27 (input rows: `Plate separation d =`, `Plate area A =`,
  `Battery voltage V =`, and the initial/new pairs) and all three data tables (sections
  8, 17, 29: `Capacitance C`, `Top plate charge Q`, `Stored energy U`) and both
  discharge-time fields carry no units and no place to record one. The sim reports mm,
  mm², V, pF, pC, pJ, and seconds; add `unit:` values to rows and units to column labels.
  No fit/slope fields exist in this lab, so the systemic slope-units gap does not apply.

### A3. PER alignment

- **[concern]** Sections 12 and 24 (Parts 1B/1C Backgrounds) instruct students to
  "predict the direction of change... before reading the sim's meters," but (a) no
  prediction field exists, and (b) the same Background states the answers two sentences
  earlier ("$V = Q/C$ rises when $C$ drops, and $U$... rises too"; "$V$ falls... $U$ also
  falls"). The prediction is hollow. Restructure each Background to teach the _method_
  (fixed-$Q$ means pick the $Q$-and-$C$ forms) without stating the directions, add a
  short committed-prediction field (C/V/U: up, down, same) before the meter readings, and
  let the existing explanation prompts close the loop. Part 1A already does
  predict-then-measure correctly; 1B/1C should match it.

### B4. Scaffolding

No findings. The observation-before-explanation split ("you do not need to explain why at
this point") is exactly right, the explanation hints point at the correct equation form
without giving the direction, and the three-part structure isolates one variable each.

### B5. Clarity and cognitive load

- **[concern]** Sections 4, 14, 26 reference "your Set of Parameters," which does not
  exist in the app (same deliberate hold for per-user-randomized-givens as Lab 04,
  documented in the file header). Until givens ship, students have no assigned $d$, $A$,
  $V$, or the new $d$/$A$ values. Same author decision as Lab 04: interim wording or a
  pointer to where the values live.
- **[suggestion]** Section 2 presents the equations in the order (2), (1), (3), because
  the tags are inherited from the manual. Renumber in presentation order, or reorder the
  prose to introduce $Q = CV$ first.

### B6. Course register

No findings. No uncertainty or error-propagation content (consistent with the manifest
note), no calculus language; percent error in `resultsAnalysis` is 114-appropriate.

## Solid

- Part 1A is the best predict-then-verify sequence in the course so far: computed
  predictions of $C$, $Q$, $U$ committed before the meters are read, then a percent-error
  comparison.
- The held-$V$ vs held-$Q$ contrast in the Part 1B Background is the conceptual heart of
  this topic and is explained correctly and compactly.
- The paired 1B/1C structure (same table shape, same question set, one variable each) is
  clean controlled-variables design and keeps cognitive load low.
- Hints on the explanation prompts direct students to the right equation _form_ (the
  $Q^2/C$ energy form under fixed $Q$) - a subtle and well-executed scaffold.
