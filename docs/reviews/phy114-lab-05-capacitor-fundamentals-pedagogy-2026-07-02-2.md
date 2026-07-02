# Pedagogy review: PHY 114 Lab 05 - Capacitor Fundamentals (re-review)

- **Lab id:** `capacitorFundamentals` (shared PHY 132 object,
  `src/content/labs/phy132/capacitorFundamentals.draft.lab.ts`, reviewed under the PHY
  114 register)
- **Course / lab number:** phy114 / 5 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 (same-day re-review after fixes) / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md`
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Prior review:** `phy114-lab-05-capacitor-fundamentals-pedagogy-2026-07-02.md` (blocked)
- **Verdict:** needs-work

## Changes since the prior review

The A1 blocker is **cleared**. The Background no longer frames discharge time as "a
qualitative proxy for the stored energy"; it now states the correct relationships (the
discharge duration tracks the capacitance - a larger $C$ holds more charge at a given
voltage and takes longer to empty through the bulb - and the initial bulb brightness
tracks the starting voltage), and the discussion prompt now asks what the discharge
observations imply about the capacitance and starting voltage rather than about stored
energy. Both statements are physically correct in the fixed-$Q$ manipulations the lab
performs, the wording is algebra-friendly (no RC exponentials), and the fix applies to
PHY 132 as well since the object is shared. Verified rendering in the browser.

## Findings (carried from the prior review, unchanged)

- **[concern, A1]** No `docs/theory/lab-05-*.md` reference exists.
- **[concern, A2]** The input rows ($d$, $A$, $V$, initial/new pairs), the three data
  tables ($C$, $Q$, $U$ columns), and the discharge-time fields still carry no units.
- **[concern, A3]** Parts 1B/1C still instruct a prediction whose answers are printed
  two sentences earlier, with no committed prediction field.
- **[concern, B5]** "Set of Parameters" references remain dangling pending the
  randomized-givens work (deliberate hold, on record).
- **[suggestion, B5]** Equation presentation order (2), (1), (3).

## Verdict rationale

No blockers remain; the carried concerns keep the verdict at needs-work. The lab is no
longer teaching a misconception, which was the enable-gating issue.
