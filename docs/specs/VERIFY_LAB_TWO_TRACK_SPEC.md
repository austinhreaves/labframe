# Verify-Lab Two-Track Spec

**Status:** Active, 2026-07-02. Codifies the architectural split between the deterministic CI
gate (Track 1, shipped) and the PER/cog-sci pedagogy rubric (Track 2, built as the
`verify-lab-pedagogy` skill; see the rubric and resolved questions below).

---

## Why two tracks

The current `verify:lab` / `verify:labs` tooling does one job well: it catches mechanical
defects before they reach students (schema violations, LaTeX leaks, broken field wiring, unit
rendering bugs). That job is binary and automatable -- correct or not -- and belongs in CI as
a hard gate.

Pedagogy quality is a different judgment: is the theory coverage accurate? Are the guiding
questions scaffolded at the right cognitive level? Does the lab sequence reflect PER best
practices? Those questions require reasoning over the full lab document, course context, and
discipline norms. They cannot be reduced to a regex. They belong in an authoring-time review
loop with Fable, not in a CI gate that blocks every merge.

Mixing the two in one tool creates pressure to either (a) weaken the CI gate by skipping
slow AI calls, or (b) block merges on rubric findings that a human would waive. Neither is
acceptable. The split keeps each track doing only what it is suited for.

---

## Track 1: Deterministic rendering-lint (current CI gate)

**Entry point:** `npm run verify:lab -- <labId>` / `npm run verify:labs` (all labs, errors-only).

**Implemented in:** `scripts/verifyLab.ts` (deterministic checker).

**What it checks (representative, not exhaustive):**

- Zod schema validation of the exported lab object.
- Required field presence: `id`, `title`, `description`, `simulations`, `sections`.
- ID uniqueness across all inputs in the lab.
- LaTeX that leaks as raw text in the PDF (commands not handled by `latexToUnicode.ts`;
  the checker derives the unsupported list from the converter itself, so it tracks
  converter coverage automatically).
- `unit: 'Symbol(unevaluable)'` sentinel strings (legacy migration artifact that renders
  literally as the column header).
- Section/input wiring integrity: every input referenced in a plot or table exists in the
  section that declares it.
- Markdown render smoke: headers, bold, lists parse without error.

**Pass/fail contract:** any finding is a hard error. `verify:labs` exits non-zero; the CI
job fails; the PR is blocked. There is no warning tier -- warnings become ignored over time.

**Scope ceiling:** Track 1 will never make AI calls, fetch external resources, or add
findings that require human judgment to waive. If a proposed check cannot be expressed as a
deterministic function of the lab object, it belongs in Track 2.

---

## Track 2: PER/cog-sci pedagogy rubric (authoring-time, Fable-reviewed)

**Status:** Built 2026-07-02 as the Claude Code skill `verify-lab-pedagogy`
(`.claude/skills/verify-lab-pedagogy/SKILL.md`).

**Invocation:** the `/verify-lab-pedagogy <labId> [--course <courseId>]` skill, run by an
author in a Claude Code session. `npm run verify:lab:pedagogy` exists only as a stub that
prints a pointer to the skill and exits non-zero, so it can never be wired into CI and
silently pass. Never called by `verify:labs`, never in CI. A standalone API-calling script
is deferred until batch review outside Claude Code is actually needed.

**Audience:** lab authors and course designers running it locally or in a dedicated authoring
workflow. Not students, not TAs.

### Rubric

Categories sit in two stakes tiers. **Tier A findings may carry any severity, including
blocker.** **Tier B findings default to suggestion or concern**; a Tier B blocker requires
an egregious defect (the canonical example: uncertainty-propagation content in a PHY 114
lab) and a one-line justification in the report.

Severity meanings:

- **blocker** -- the lab must not be (or remain) `enabled: true` until this is fixed.
- **concern** -- should be fixed before the lab ships to another semester; author weighs it.
- **suggestion** -- an improvement the author may take or leave.

#### Tier A (high stakes)

**A1. Theory accuracy.**

- Equations dimensionally consistent; constants correct in value and unit.
- Approximations and idealizations stated where they change the result (point charge,
  thin lens, ideal battery/wire, uniform field, small angle).
- Narrative matches the simulation model actually used: if the sim idealizes (infinite
  plates, ideal meters), the prose must not derive or imply corrections the sim ignores,
  and vice versa.
- Derived-column formulas and expected-value logic match the taught equations; sign
  conventions consistent throughout (lens conventions, potential vs. potential energy,
  current direction).
- If `docs/theory/lab-NN-*.md` exists, check the lab against it and flag contradictions
  in either direction; if the theory doc itself is incomplete or needs adjustment, say so
  explicitly. If no theory doc exists, record one **concern** for the missing reference
  and review theory accuracy from the lab's own instruction/Background blocks. Never skip
  this category.

**A2. Units.**

- Every numerical quantity intended to represent something physical (given, input field,
  table column, plot axis, reported result) carries a unit. Dimensionless exceptions:
  counts, ratios, percent error, index of refraction, magnification, and the like.
- Units are consistent within a Part (no silent cm-to-m switches mid-calculation) and
  correct for the quantity they label.
- **Fit results:** wherever a student records a slope or intercept from a fit, there must
  be a separate, explicit, clear place to enter the units that slope/intercept carries
  (or the field label itself must state the correct unit). A bare unitless "slope ="
  field is a finding. This is a known systemic gap; check every graphing section.
- Prefix and scientific-notation usage is consistent; flag mixing (uC in one column,
  10^-6 C in the next) when it adds load without purpose.

**A3. PER alignment.**

- Prediction before measurement: the lab elicits a committed student prediction (an
  answer field, not a rhetorical aside) before the measurement that tests it.
- Discrepancy reasoning: when measured and predicted/theoretical values differ, students
  are asked to explain the discrepancy, not just compute percent error and move on.
- Uncertainty as reasoning (PHY 132 only): uncertainty feeds a decision (do intervals
  overlap? is the fit consistent with theory?), not a checkbox column.
- Sense-making closes each Part: a units check, limiting case, or "is this number
  reasonable" prompt, so data collection is not the last word.

#### Tier B (default suggestion/concern)

**B4. Scaffolding.**

- Question sequence within a Part follows Bloom order: recall/identify, then
  apply/calculate, then explain/synthesize.
- Concept-check prompts appear after students have the data or observation needed to
  answer them, not before.
- Guidance fades across the lab: early Parts more scaffolded than later ones; no
  cold-open synthesis questions.

**B5. Clarity and cognitive load.**

- No single section asks students to track more than ~4 independent new concepts
  simultaneously.
- Procedural steps (`**Step N.**`) are cleanly separated from conceptual questions; one
  step does one thing.
- Notation is stable (a symbol means one thing across the lab); prompts are unambiguous;
  every referenced artifact ("the table below", "your value from Part 2") exists.

**B6. Course register.**

- PHY 114 is algebra-based: no calculus language (derivative, integral, "in the limit"),
  no uncertainty or error-propagation columns or prompts. Percent error is fine.
  Uncertainty content in a 114 lab is the canonical Tier B escalation to blocker.
- PHY 132 is calculus-based with uncertainty: missing uncertainty treatment where the
  reasoning needs it is a finding, as is checkbox uncertainty (cross-reference A3).
- Vocabulary and reading level fit intro students; jargon is introduced before it is used.

### Review procedure (normative for the skill)

1. Run Track 1 first (`npm run verify:lab -- <labId> --json`). If it reports errors, stop
   and say so; Track 2 assumes a mechanically valid lab.
2. Read the full lab source **and the course manifest entry**. Register and lab number
   come from the course under review, not from the file's directory: a shared lab object
   (e.g. a PHY 132 lab reused by PHY 114) is reviewed in the register of the course being
   reviewed.
3. Read the matching `docs/theory/lab-NN-*.md` if present.
4. Apply the rubric category by category, in tier order.
5. Write the report (format below) and save it.

**Reviewer:** Fable (claude-fable-5). Fable reads the full lab source, the matching theory
reference (`docs/theory/lab-NN-*.md` if present), and the rubric, then returns a structured
report: category, finding, severity (suggestion / concern / blocker), and a suggested
remediation. Blockers should block the lab from being set `enabled: true`; concerns and
suggestions are for the author to weigh.

**Fable is NOT a student-pipeline component.** It reviews lab content at authoring time, the
same way a co-author would. It has no access to student answers, no role in grading, and
produces no output that reaches the signed envelope or the PDF report.

### Report format

Committed artifact: `docs/reviews/<courseId>-lab-NN-<slug>-pedagogy-<YYYY-MM-DD>.md`.
(The course prefix extends the originally planned filename because lab objects are shared
across courses: both the lab number and the register are properties of the course under
review, not of the lab file.) A re-review writes a new dated file; old reports are never
overwritten -- the accumulated files are the lab-quality record over time.

Structure: a header (lab id, course, lab number, title, date, reviewer model, verdict),
findings grouped by rubric category in tier order -- each with severity, location (section
index or heading), the finding, and a concrete suggested remediation -- then a short
"solid" list of what is working so authors know what not to touch. Verdict is one of:
**ready / ready-with-suggestions / needs-work / blocked**.

---

## Decision record

| Decision                                       | Rationale                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two separate commands, not flags               | Prevents accidental AI calls in CI (`--pedagogy` flag would be too easy to add to the gate).                                                                                                              |
| Track 2 is authoring-time only, not CI         | Pedagogy findings require author judgment; blocking merges on them would create pressure to suppress or waive findings without documentation.                                                             |
| Track 1 has no warning tier                    | Warnings become ignored. Hard errors get fixed.                                                                                                                                                           |
| Fable, not GPT-4 or Sonnet                     | Fable (claude-fable-5) is the most capable Claude model for long-document reasoning and nuanced pedagogy judgment. Track 2 is a high-value, low-frequency operation -- latency and cost are acceptable.   |
| Rubric is a spec artifact, not a prompt        | Writing the rubric in this spec (not inside a system prompt) means it can be versioned, reviewed, and cited. The prompt passed to Fable at runtime will reference this spec.                              |
| Reports are committed to `docs/reviews/`       | The record of lab quality over time outweighs repo noise; dated filenames make re-reviews additive rather than destructive.                                                                               |
| Missing theory doc is a concern, not a blocker | Only lab-01 has a theory doc today; blocking on the doc backlog would block every lab. Theory accuracy is still reviewed from the lab's own Background blocks, never skipped.                             |
| Skill first, standalone script deferred        | The skill runs on Fable inside Claude Code with no API-key plumbing and keeps the conversational authoring loop. The npm command is a stub that exits non-zero so it can never pass silently in CI.       |
| Two stakes tiers, no numeric weights           | Theory accuracy, units, and PER alignment can produce blockers; scaffolding, clarity/load, and register default to suggestion/concern unless egregious. Numeric scores invite gaming and false precision. |

---

## Resolved questions (2026-07-02)

The four open questions from the draft were resolved with the author and are recorded in
the decision table above: reports are committed to `docs/reviews/`; a missing theory
reference is a concern (theory accuracy is reviewed from in-lab content); Track 2 ships as
a skill with the npm command as a non-passing stub; categories are tiered (A: theory
accuracy, units, PER alignment; B: scaffolding, clarity/load, register) with no numeric
weighting.
