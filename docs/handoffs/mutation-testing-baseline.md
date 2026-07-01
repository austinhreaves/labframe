# Mutation testing baseline (Stryker)

`npm run test:mutation` runs Stryker over the pure, high-blast-radius modules listed in
`stryker.config.json`. It is an **on-demand audit, not a CI gate** (see the Commands table
in `CLAUDE.md`): it answers "do the existing tests actually catch injected bugs?" rather
than measuring line coverage. Run it periodically or before a release.

## Why this exists

Line coverage says a line ran; it does not say a test would fail if that line were wrong.
Mutation testing injects deliberate bugs (flip a `<` to `<=`, drop a branch, swap `&&`
for `||`) and checks whether the suite screams. A surviving mutant is a bug the current
tests would not catch. This bounds the "who tests the tests" regress at exactly one level.

## Baseline (first run, 2026-06-29)

Overall mutation score ~52% across the scoped modules. Per file:

| Module                                          | Score | Read                                                                               |
| ----------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| `math/leastSquares.ts`                          | 89%   | Strong; reference-value tests are load-bearing.                                    |
| `integrity/canonicalize.ts`                     | 69%   | Good; property tests cover ordering/normalization.                                 |
| `integrity/buildAnswers.ts`                     | 47%   | Conditional optional-field emission under-tested.                                  |
| `pdf/markdown/latexToUnicode.ts`                | 43%   | Many survivors are equivalent mutants in the glyph maps + dev-only `console.warn`. |
| `state/persistence/labPersistenceMiddleware.ts` | 37%   | Migration default values and the early-return guard at line ~171 under-tested.     |

No failing threshold is set yet. Do not treat 52% as a target to grind to 100% - a large
share of `latexToUnicode` survivors are **equivalent mutants** (the mutated map entry is
never the one a test exercises, or the change is unobservable) and should be accepted, not
chased.

## Triage guidance (highest value first)

When you do a triage pass, work the modules where a survivor maps to a real silent-failure
risk, and for each survivor either add the missing assertion or consciously accept it:

1. **`labPersistenceMiddleware.ts`** - survivors on migration default values and the
   `if (!state.courseId || !state.labId || !state.studentName) return;` guard. A wrong
   migration default silently loses student work; worth real assertions.
2. **`buildAnswers.ts`** - survivors on conditional field emission (e.g. `aiSharedLinks`
   only when `aiUsed && links.trim()`). These gate what lands in the signed envelope.
3. **`canonicalize.ts`** - the remaining ~9 survivors; check whether any are real before
   adding tests (some are equivalent).
4. **`latexToUnicode.ts`** - last. Most survivors are equivalent (glyph-map entries, dev
   warnings). Add assertions only for survivors that would actually leak markup into a PDF.

## Notes

- Runtime is ~12 minutes (dominated by `latexToUnicode`'s large mutant count). Acceptable
  for an on-demand audit; if it needs to be faster, narrow `mutate` to one module per run.
- The HTML report lands at `reports/mutation/index.html` (git-ignored). Open it to browse
  survivors with source context.
- Do **not** widen the `mutate` scope to UI/IO code - it is slow and floods the report
  with meaningless survivors. UI is covered by the Playwright + axe e2e suite.
