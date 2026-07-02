---
name: verify-lab
description: Review a LabFrame lab for content and rendering defects. Runs the deterministic checker (math leaks, schema, ids, wiring) then adds a judgment review of theory coverage, physics, and clarity. Use when asked to verify, review, check, or audit a lab, or before enabling a draft lab. Report only, no edits.
---

# Verify a lab

Produce a single review report for one lab: `<id>` or a `*.lab.ts` path. You do NOT
edit files. You find problems and report them with locations and suggested fixes; the
author decides what to change.

## Step 1 - run the deterministic checker

```bash
npm run verify:lab -- <labId> --json
```

This returns, per lab: a `findings` array (schema errors, duplicate answer ids, unwired
labs, unbalanced `$`, em dashes, and math-unsupported leaks where LaTeX the converter
cannot handle will render as raw text in the PDF) and you should also run it without
`--json` once to read the **section outline** (ordered list of section kinds and
instructions headings). Carry every checker finding into your final report verbatim - do
not re-derive or second-guess them.

If the checker fails to run, report that and stop; do not guess at its results.

## Step 2 - read the lab source

Open the lab file (`src/content/labs/<course>/<name>.lab.ts` or `.draft.lab.ts`). Read it
in full. The schema for what each section kind means is `src/domain/schema/lab.ts`.
Theory is delivered as `instructions` blocks with `## Background:` / `### Part N` headings
(there is no `theory` section kind), and procedural step lead-ins may live in
`concept.preamble`.

## Step 3 - judgment review

Using the section outline plus the source, review what the checker cannot:

- **JIT theory coverage.** Walk the outline in order. Every `### Part N` that asks the
  student to predict, measure, or calculate something should have a `## Background` block
  (or equivalent theory) delivering the needed concept and equations *before* it, not all
  front-loaded at the top and not missing. Flag any Part whose required concept is never
  introduced, introduced too late, or dumped far ahead of where it is used.
- **Physics and formula correctness.** Check that stated equations, units, constants, and
  derived-column formulas are physically correct and self-consistent (e.g. the parallel
  plate relation, energy expressions, sign conventions). Flag anything wrong or ambiguous.
- **PHY 114 only:** the lab must NOT contain uncertainty or error-propagation content
  (114 is algebra-based). Percent error is fine. Flag any uncertainty columns or language.
  PHY 132 and PHY 112 may use uncertainty.
- **Clarity and consistency.** Prompts unambiguous, step numbering consistent within a
  Part, notation consistent (a symbol means one thing), table/plot labels match the
  quantity being recorded, no orphaned references ("the table below" with no table).

## Step 4 - write the report

One report, grouped by severity, every finding with a `section[i]` location and a concrete
suggested fix. Structure:

1. **Summary** - lab id, title, total errors / warnings, one-line verdict (ready, or needs
   work in N areas).
2. **Deterministic findings** - from the checker, unchanged.
3. **Theory and content findings** - your judgment review, each tagged JIT / physics /
   114-uncertainty / clarity.
4. **Looks good** - a short list of what is solid, so the author knows what not to touch.

Do not use em dashes anywhere in the report. Keep it skimmable; the goal is a fast,
trustworthy review, not exhaustive nitpicking.
