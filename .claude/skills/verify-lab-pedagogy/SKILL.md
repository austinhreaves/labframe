---
name: verify-lab-pedagogy
description: Track 2 pedagogy review of a LabFrame lab against the PER/cog-sci rubric in docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md. Deep authoring-time judgment review (theory accuracy, units, PER alignment, scaffolding, load, course register) that writes a committed report to docs/reviews/. Use when asked for a pedagogy review, rubric review, or Track 2 review of a lab, or before enabling a draft lab for a new course. Report only, no lab edits. For quick mechanical checks use verify-lab instead.
---

# Pedagogy review of a lab (Track 2)

Review one lab against the Track 2 rubric and write a committed report. You do NOT edit
lab files. The rubric's source of truth is `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md`
(section "Track 2"); read it before reviewing and apply it as written. If this skill and
the spec disagree, the spec wins.

Arguments: a lab id or `*.lab.ts` path, and the course context (`--course <courseId>` or
stated in the request). **Course context is required**: register (algebra vs. calculus,
uncertainty or not) and the lab number both come from the course manifest
(`src/content/courses/<courseId>.course.ts`), not from the lab file's directory. A PHY 132
lab object reused by PHY 114 is reviewed under PHY 114 rules when PHY 114 is the course
under review. If the course is not given and the lab belongs to more than one course, ask.

## Step 1 - gate on Track 1

```bash
npm run verify:lab -- <labId> --json
```

If the checker reports errors, stop and say so: Track 2 assumes a mechanically valid lab,
and rubric findings against a broken lab waste the author's time. Also run it once without
`--json` to get the section outline. If the checker itself fails to run, report that and
stop.

## Step 2 - gather context

1. Read the full lab source (`src/content/labs/<course>/<name>.lab.ts` or `.draft.lab.ts`).
   Schema semantics: `src/domain/schema/lab.ts`. Theory lives in `instructions` blocks with
   `## Background:` / `### Part N` headings; step lead-ins may live in `concept.preamble`.
2. Read the course manifest entry: lab number, `enabled`, `group`.
3. Look for a matching theory reference `docs/theory/lab-NN-*.md` (NN = the lab number in
   the course under review). If present, read it in full. If absent, that is one
   **concern** finding under A1; still review theory accuracy from the lab's own content.

## Step 3 - apply the rubric

Work through the spec's rubric category by category, in tier order:
Tier A (any severity, including blocker): **A1 theory accuracy, A2 units, A3 PER
alignment**. Tier B (suggestion/concern unless egregious, with a one-line justification
for any escalation): **B4 scaffolding, B5 clarity and load, B6 course register**.

Apply every bullet in the spec's rubric; do not paraphrase from memory. Standing checks
worth extra attention:

- A2 fit-units gap: every place a student records a fit slope or intercept needs an
  explicit place (or labeled field) for its units. Known systemic issue.
- B6 for PHY 114: any uncertainty or error-propagation content is the canonical Tier B
  escalation to blocker. Percent error is fine.
- A1: if the theory doc contradicts the lab, flag the contradiction and say explicitly
  which artifact needs the fix; theory docs can be wrong too.

Severity: **blocker** = must not be/remain `enabled: true`; **concern** = fix before next
semester; **suggestion** = author's choice.

## Step 4 - write the report

Save to `docs/reviews/<courseId>-lab-NN-<slug>-pedagogy-<YYYY-MM-DD>.md` (zero-padded NN,
slug from the lab id in kebab-case). Never overwrite an existing report; re-reviews get a
new date, and same-day re-reviews a `-2` suffix. Create `docs/reviews/` if missing. The
report is committed to the repo; it is the lab-quality record over time.

Structure:

```markdown
# Pedagogy review: <course> Lab NN - <title>

- Lab id / course / lab number / title
- Date, reviewer model (claude-fable-5), rubric spec version (git short hash)
- Track 1 result (clean, or stopped-on-errors)
- Theory reference used (path, or "none - flagged under A1")
- **Verdict:** ready | ready-with-suggestions | needs-work | blocked

## Findings

(grouped by category A1..B6 in tier order; omit empty categories with a one-line "no
findings" note. Each finding: severity, location (section index or heading), the finding,
and a concrete suggested remediation. Tier B escalations carry their justification.)

## Solid

(short list of what is working, so the author knows what not to touch)
```

Verdict rule: any blocker means **blocked**; any concern means **needs-work**;
suggestions only means **ready-with-suggestions**; nothing means **ready**.

Then give the author a short conversational summary: verdict, blocker/concern counts, and
the two or three findings that matter most. No em dashes anywhere.

## Batch mode

For "review all labs in course X": run the steps above per enabled lab, one report file
each, then a final cross-lab summary table (lab, verdict, blockers, concerns) in the
conversation. Do not merge findings across labs into one file.
