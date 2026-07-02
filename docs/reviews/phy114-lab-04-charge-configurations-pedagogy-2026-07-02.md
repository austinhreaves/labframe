# Pedagogy review: PHY 114 Lab 04 - Charge Configurations

- **Lab id:** `chargeConfigurations` (shared PHY 132 object,
  `src/content/labs/phy132/chargeConfigurations.draft.lab.ts`, reviewed under the PHY 114
  register)
- **Course / lab number:** phy114 / 4 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-04-*.md` reference exists. Reviewed from the lab's own
  Background blocks, which are otherwise sound (superposition, dipole geometry, uniform
  field definition, fringing fields, the capacitor lead-in).
- **[suggestion]** Section 2. The claim that equipotential-field perpendicularity "is a
  direct consequence of equation (6) from the previous lab combined with
  $\vec{E} = -\nabla V$" is muddled: perpendicularity is general and does not follow from
  the point-charge potential specifically. The remediation below under B6 fixes both
  problems at once.

### A2. Units

No findings. The lab is qualitative: no numeric fields, tables, plots, or fits.

### A3. PER alignment

- **[concern]** No committed prediction anywhere, and section 8 (Background: What Makes a
  Field Uniform?) pre-announces Part 2B's result ("you'll stack several dipoles... and
  observe how the field in the central region becomes much more uniform"). The single
  highest-value fix: before that Background, ask students to predict (one short field)
  whether stacking dipoles will make the central field more or less uniform, and why.
  Then the Part 2B observation actually tests something.

### B4. Scaffolding

No findings. Observe the dipole, observe the stack, compare, then transfer to the
energy-storage design question; the causality nudge ("what causes what?") is well placed.

### B5. Clarity and cognitive load

- **[concern]** Sections 4 and 10 direct students to "the Set of Parameters," which does
  not exist in the app. The file header documents this as a deliberate hold for the
  per-user-randomized-givens spec (do not inline values), but until that ships, enrolled
  students see a dangling reference and have no assigned charge counts, spacings, or ring
  positions. Author decision needed: either an interim instruction rewrite ("place two
  charges of equal and opposite sign a few grid squares apart"; "three or more dipoles")
  that avoids hard values, or a pointer to wherever the parameters actually live for
  students (Canvas). Flagged for weighing, not as a blocker, since the deliberate
  decision is on record.
- **[suggestion]** Section 2 cites "equation (6) from the previous lab." Cross-lab
  equation numbering is fragile (and Lab 3's numbering is itself inherited and orphaned).
  Say "the point-charge potential $V = kq/r$ from the previous lab" instead.

### B6. Course register

- **[concern]** Section 2 uses $\vec{E} = -\nabla V$. Gradient notation is vector
  calculus; PHY 114 students have seen neither. Replace the justification with an
  algebra-friendly argument that is also more correct (see A1): "field lines and
  equipotentials always meet at right angles; if the field had a component along an
  equipotential, the potential would change along it, contradicting 'equipotential'."
  This wording works for PHY 132 as well, so the shared object can be fixed once,
  without forking a 114 copy.

No uncertainty content (consistent with the manifest note that this reused 132 lab has
none to strip).

## Solid

- The dipole-to-stacked-dipoles-to-capacitor arc is a textbook example of building the
  parallel-plate concept from superposition rather than asserting it.
- The paired concept checks (2A vs 2B, same questions) make the comparison structural
  rather than rhetorical, and the "(At minimum: ...)" fallbacks keep weaker students
  moving.
- The energy-storage design question is a genuine synthesis item that foreshadows the
  next lab without requiring capacitor formalism.
