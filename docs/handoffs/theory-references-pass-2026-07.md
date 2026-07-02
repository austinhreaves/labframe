# Handoff: PHY 114 theory reference pass (2026-07)

## Goal

Author the student-facing theory reference for each enabled PHY 114 lab that lacks one.
Lab 1 exists (`docs/theory/lab-01-charge-buildup.md` + `.html`); Labs 2 through 11 do
not. Each lab gets a Markdown source of truth `lab-NN-kebab-name.md` and a matching
self-contained `lab-NN-kebab-name.html` (inline CSS, no external deps) for Canvas embed.

## Read first (in this order)

1. `docs/archive/theory-references-handoff.md` - the original authoring brief. Has the
   full lab-to-file mapping table and the old-materials folder for each lab. It predates
   the pedagogy reviews below, so treat its process as correct but its "what to cover"
   as incomplete. It is marked archived/stale; the mapping table is still accurate.
2. `docs/theory/lab-01-charge-buildup.md` and `.html` - the format exemplar. Match its
   structure, heading style, and the `.md`/`.html` pairing. NOTE: this exemplar has a
   physics error to fix (see below) before copying its induction section.
3. `docs/reviews/phy114-lab-NN-*-pedagogy-2026-07-02.md` - one committed report per lab
   from this session's Track 2 batch. Each report's **A1 (theory accuracy)** section is
   the spec for what that lab's theory doc must get right, and flags the missing
   reference. Read the target lab's report before writing its doc.
4. Memory `reference_phy114_external_materials.md` - folder location, folder-to-lab
   mapping, path quirks, and text-extraction approach for the old lab manuals (the
   source physics content).

## Lab inventory (PHY 114 course manifest order)

| #   | lab ref                          | theory doc                    | status                                |
| --- | -------------------------------- | ----------------------------- | ------------------------------------- |
| 1   | chargeBuildup                    | lab-01-charge-buildup         | exists, needs the induction fix below |
| 2   | coulombsLaw                      | lab-02-coulombs-law           | to write                              |
| 3   | pointCharge                      | lab-03-point-charge           | to write                              |
| 4   | chargeConfigurations             | lab-04-charge-configurations  | to write                              |
| 5   | capacitorFundamentals            | lab-05-capacitor-fundamentals | to write                              |
| 6   | capacitorNetworks                | lab-06-capacitor-networks     | to write                              |
| 7   | ohmsLaw (Continuity & Ohm's Law) | lab-07-ohms-law               | to write                              |
| 8   | kirchhoffsLaws                   | lab-08-kirchhoffs-laws        | to write                              |
| 9   | snellsLaw                        | lab-09-snells-law             | to write                              |
| 10  | convergingLens                   | lab-10-converging-lens        | to write                              |
| 11  | divergingLens                    | lab-11-diverging-lens         | to write                              |

Lab numbers are the PHY 114 numbers (`src/content/courses/phy114.course.ts`). Several
labs are shared PHY 132 objects reused by 114; the theory doc is written for the 114
register regardless of which directory the lab file lives in.

## Hard constraints

- **PHY 114 is algebra-based: no calculus in the theory docs.** No derivatives, integrals,
  gradients, or "in the limit" language. State results; do not derive them via calculus.
  Two shared-object labs contain calculus that leaked from their 132 source and must NOT
  be reproduced in the 114 theory doc:
  - Lab 3 (pointCharge) Background derives V = kq/r by "integrating E dot dr from infinity";
    the theory doc should just state the result.
  - Lab 4 (chargeConfigurations) uses the gradient E = -grad V; use the algebra-friendly
    "field lines meet equipotentials at right angles" argument instead (see the Lab 4
    review A1/B6).
- **No uncertainty or error propagation** in 114 theory docs. Percent error is fine.
- **No em dashes** anywhere (prose, docs, commit messages). Use a hyphen or rewrite.
- The theory doc is student-facing background reading, not a worksheet: no answer fields,
  no "record your value" prompts, no integrity-agreement boilerplate.

## Physics fix required in the existing Lab 1 doc

Both `docs/theory/lab-01-charge-buildup.md` (lines ~45-51) and the lab's in-content
Background state that after charging by induction the conductor "retains a net charge
opposite to the inducing object." That is correct for the ground-and-disconnect case but
wrong for the split-conductor case that Lab 1 Part 1C actually simulates: only the piece
nearer the rod ends up opposite, the far piece ends up the same sign, and the two-piece
system stays net-neutral by conservation of charge. Fix the theory doc (and note that the
lab content needs the same fix; it is tracked in
`docs/reviews/phy114-lab-01-charge-buildup-pedagogy-2026-07-02.md` under A1). Get this
right before reusing Lab 1 as the template for Labs 2-11.

## Per-doc definition of done

- Covers every concept the lab asks students to predict, measure, or calculate, drawn
  from the lab's A1 review findings and the old-materials folder.
- Physics is correct and dimensionally consistent; constants have units; approximations
  (point charge, thin lens, ideal battery/wire, small angle) are stated where they matter.
- Algebra-based register throughout (see constraints).
- `.md` and `.html` are content-identical; the `.html` is self-contained (inline CSS,
  matches the Lab 1 HTML head/style block).
- No em dashes; Prettier-clean (`npx prettier --check docs/theory/lab-NN-*.md`).

## Out of scope for this pass

- The non-theory concerns in the reviews (missing units on measurement rows, dangling
  "Set of Parameters" references, missing prediction fields). Those are lab-content edits
  for a separate pass; do not fold them into the theory docs.
- Re-running the Track 2 pedagogy review. Once a lab's theory doc exists, its next
  pedagogy re-review will upgrade that lab's A1 "missing reference" concern; that is a
  later step, not part of writing the docs.

## Verification

There is no md-to-html build step; the `.html` is authored/updated by hand alongside the
`.md`. After writing: `npx prettier --check docs/theory/lab-NN-*.md`, eyeball the `.html`
in a browser (the `theory-preview` config in `.claude/launch.json` serves `docs/theory`
on port 5174), and confirm no em dashes. `npm run verify:labs` does not touch theory docs,
so it is not a gate here.
