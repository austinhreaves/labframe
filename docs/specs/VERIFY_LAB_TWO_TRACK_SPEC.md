# Verify-Lab Two-Track Spec

**Status:** Draft, 2026-07-01. Codifies the architectural split between the deterministic CI
gate (already built) and the PER/cog-sci pedagogy rubric (earmarked, not yet built).

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
- LaTeX that leaks as raw text in the PDF (tags not handled by `latexToUnicode.ts`,
  e.g. `\tag`, `\tfrac`, `\begin{...}`).
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

**Status:** Earmarked. Rubric not yet written; tooling not yet built.

**Invocation (planned):** `npm run verify:lab:pedagogy -- <labId>` -- separate command,
never called by `verify:labs`, never in CI.

**Audience:** lab authors and course designers running it locally or in a dedicated authoring
workflow. Not students, not TAs.

**What it reviews (rubric categories, to be elaborated):**

1. **Theory accuracy** -- are equations dimensionally consistent? Are approximations stated?
   Does the narrative match the simulation model?
2. **Scaffolding** -- do guiding questions build in Bloom's taxonomy order (recall before
   application before synthesis)? Are concept-check prompts placed after students have the
   data they need to answer them?
3. **PER alignment** -- does the lab elicit prediction before measurement? Are students asked
   to explain discrepancies rather than just report them? Is uncertainty (132 only) treated
   as a reasoning tool, not a checkbox?
4. **Clarity and load** -- is any single section asking students to track more than ~4
   independent concepts simultaneously? Are procedural steps (Step N.) distinct from
   conceptual questions?
5. **PHY 114 / 132 register** -- 114 is algebra-based; 132 uses calculus and uncertainty
   propagation. Flag register mismatches (e.g. calculus language in a 114 lab, missing
   uncertainty columns in a 132 lab).

**Reviewer:** Fable (claude-fable-5). Fable reads the full lab source, the matching theory
reference (`docs/theory/lab-NN-*.md` if present), and the rubric, then returns a structured
report: category, finding, severity (suggestion / concern / blocker), and a suggested
remediation. Blockers should block the lab from being set `enabled: true`; concerns and
suggestions are for the author to weigh.

**Fable is NOT a student-pipeline component.** It reviews lab content at authoring time, the
same way a co-author would. It has no access to student answers, no role in grading, and
produces no output that reaches the signed envelope or the PDF report.

**Output format (planned):** structured Markdown report written to stdout, optionally saved
to `docs/reviews/lab-NN-<slug>-pedagogy-<date>.md`. No JSON schema required initially --
the report is for human consumption.

---

## Decision record

| Decision | Rationale |
|---|---|
| Two separate commands, not flags | Prevents accidental AI calls in CI (`--pedagogy` flag would be too easy to add to the gate). |
| Track 2 is authoring-time only, not CI | Pedagogy findings require author judgment; blocking merges on them would create pressure to suppress or waive findings without documentation. |
| Track 1 has no warning tier | Warnings become ignored. Hard errors get fixed. |
| Fable, not GPT-4 or Sonnet | Fable (claude-fable-5) is the most capable Claude model for long-document reasoning and nuanced pedagogy judgment. Track 2 is a high-value, low-frequency operation -- latency and cost are acceptable. |
| Rubric is a spec artifact, not a prompt | Writing the rubric in this spec (not inside a system prompt) means it can be versioned, reviewed, and cited. The prompt passed to Fable at runtime will reference this spec. |

---

## Open questions (to resolve before building Track 2)

1. Should the pedagogy report be committed to the repo, or is it ephemeral? Committing it
   creates a record of lab quality over time but adds repo noise.
2. How should Fable handle labs that have no matching `docs/theory/` reference? Skip theory
   accuracy checks, or flag the missing reference as a blocker?
3. Should Track 2 be a standalone script, a Claude Code skill (`/verify-lab-pedagogy`), or
   both? A skill invocation is ergonomic for ad-hoc use; a script enables batch review of
   all labs before a semester starts.
4. Rubric category weights: all categories equal, or are some (theory accuracy, PER
   alignment) higher-stakes than others (clarity, load)?
