# Pedagogy review: PHY 114 Lab 06 - Capacitor Networks

- **Lab id:** `capacitorNetworks` (shared PHY 132 object,
  `src/content/labs/phy132/capacitorNetworks.draft.lab.ts`, reviewed under the PHY 114
  register)
- **Course / lab number:** phy114 / 6 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-06-*.md` reference exists. The in-lab Background
  physics is correct throughout: parallel and series combination rules with the right
  same-voltage / same-charge justifications, the charge-sharing voltage
  $V = Q_0/(C_1 + C_2 + \dots)$, the collapse-then-split recipe for the mixed network,
  and the inverse-proportional voltage split across the series pair. The Step A/B/C
  charge bookkeeping in the section 7 procedure (what is isolated when, what voltage
  $C_1$ retains) is also correct.

### A2. Units

- **[concern]** Sections 5 and 13 (`Battery voltage V₀ =`) and every voltage column in
  both data tables (sections 8, 16) carry no units. Everything here is volts; add
  `unit: 'V'` to the fields and `(V)` to the column labels. No fits or slopes in this
  lab.

### A3. PER alignment

- **[concern]** Both parts run the sequence backwards: procedure step 3 has students
  measure all voltages into the table, then step 4 (sections 9, 17) says "Predict the
  voltage across each capacitor..." A prediction recorded after the measured values sit
  one scroll above is a post-diction. Swap the order in both parts: predict from
  conservation of charge first (the prompts already scaffold the method well), then run
  the switching steps and fill the table, then compute percent errors. No new fields are
  needed; this is a section-order change plus retitling "Predict" to "Compare" where
  appropriate.
- **[suggestion]** Both calculation prompts end at percent error. Add a clause asking
  students to account for any discrepancy (voltmeter connection resistance in the sim,
  reading before the transient settles).

### B4. Scaffolding

- **[concern]** The lab has no concept checks at all: each part is build, measure,
  calculate, and then the lab jumps to the final discussion. Every other lab in the
  sequence interleaves qualitative checkpoints. Two cheap, high-value additions: after
  Part 2A, "Where did the energy go when the charge redistributed?" or at minimum "Why
  does $V$ drop every time another capacitor joins?"; after Part 2B, "Why must $C_2$ and
  $C_3$ carry the same charge?" (the latter is asserted twice in the prose but never
  asked).

### B5. Clarity and cognitive load

- **[concern]** Sections 4 and 12 hang the entire circuit topology on "your Set of
  Parameters," which does not exist in the app (same deliberate randomized-givens hold
  as Labs 04-05, per the file header). This lab is the batch's worst case: the switch
  arrangement ($S_1$/$S_2$/$S_3$) that the Step A/B/C procedure references is never
  drawn or described concretely anywhere the student can see, so the lab is not
  buildable as shipped. Until givens ship, this needs at least a circuit sketch or an
  explicit textual description of the switch arrangement (an `image` section with a
  reference schematic would do).

### B6. Course register

No findings. No uncertainty or calculus content; the algebra (reciprocal sums, inverse
proportion) is 114-appropriate and scaffolded in the prompts.

## Solid

- The three-step sequential sharing design in Part 2A (each step reuses the previous
  step's charge state) is a genuinely good conservation-of-charge exercise, and the
  procedure's bookkeeping notes ("$C_1$ is isolated and retains its Step-B voltage")
  are exactly the cues students need.
- The collapse-then-split method in the Part 2B Background is the right general skill,
  taught on the smallest network that exercises it.
- Both calculation prompts scaffold method rather than answers.
