# Handoff: PHY 132 `Symbol(unevaluable)` unit cleanup

**For:** a fresh agent. Self-contained; you do not need prior conversation context.

**Status:** ready to execute. Mechanical, low-risk, no product decision required.

## Background

The legacy lab migration left a placeholder string `unit: 'Symbol(unevaluable)'` in many
`dataTable` column definitions. It is a valid non-empty string, so `npm run verify:lab` does **not**
flag it, but it renders as the literal column unit ("Symbol(unevaluable)") in the worksheet and the
exported PDF. The fix is to remove the bogus `unit` field.

The identical artifact was already cleaned out of the six enabled **PHY 114** labs in a prior
session (see `docs/lab-audit-phy114-2026-06-26.md`, Finding 2, marked RESOLVED). This handoff
applies the same fix to the enabled **PHY 132** labs that still carry it. The cleaned PHY 114 files
are a good reference for what "done" looks like; three of them are the sibling copies of files in
scope here (`phy114/coulombsLaw.draft.lab.ts`, `phy114/pointCharge.draft.lab.ts`,
`phy114/ohmsLaw.draft.lab.ts`).

## Scope: exactly these 5 files

All are `enabled: true` in `src/content/courses/phy132.course.ts`. Counts are occurrences of the
artifact as of this writing:

| File | occurrences |
| --- | --- |
| `src/content/labs/phy132/pointCharge.draft.lab.ts` | 9 |
| `src/content/labs/phy132/coulombsLaw.draft.lab.ts` | 4 |
| `src/content/labs/phy132/ohmsLaw.draft.lab.ts` | 4 |
| `src/content/labs/phy132/generator.draft.lab.ts` | 6 |
| `src/content/labs/phy132/faradayInduction.draft.lab.ts` | 2 |

`capacitorFundamentals`, `capacitorNetworks`, and `kirchhoffsLaws` (also `phy132/` files, enabled in
both courses) were already cleaned in the prior session. `chargeBuildup` and `chargeConfigurations`
never had the artifact.

## Do NOT touch (out of scope)

- **The retired source drafts**, which are `enabled: false` in both course manifests and frozen for
  grader record access: `phy132/staticElectricity.draft.lab.ts`, `phy132/chargesFields.draft.lab.ts`,
  `phy132/dcCircuits.draft.lab.ts`, `phy132/magneticFieldFaraday.draft.lab.ts`, `phy132/capacitors.draft.lab.ts`,
  and the `phy114/*` combined drafts. Their `Symbol(unevaluable)` does not ship. Leave them as-is.
- **Uncertainty content.** PHY 132 is calculus-based and *does* use uncertainty / error propagation
  (unlike PHY 114). Do not strip uncertainty columns or language from these labs. This task is units
  only.

## The fix

Remove the `unit: 'Symbol(unevaluable)'` field wherever it appears in the 5 in-scope files. It shows
up in two syntactic shapes:

- **Inline:** `{ id: 'x', label: 'y', kind: 'input', unit: 'Symbol(unevaluable)' }`. Remove the
  `, unit: 'Symbol(unevaluable)'` substring, leaving `{ id: 'x', label: 'y', kind: 'input' }`.
- **Own-line (multi-line object):** a line `unit: 'Symbol(unevaluable)',` by itself. Remove the whole
  line (newline + indentation + the field). The preceding `kind: 'input',` keeps its trailing comma,
  which is valid.

Practical method (what worked last session): per file, `replace_all` the inline substring
`, unit: 'Symbol(unevaluable)'` with empty, then `replace_all` the own-line form
`\n<indent>unit: 'Symbol(unevaluable)',` with empty. **Confirm the exact indentation per file with a
`grep -n` first** rather than assuming; the prior files used 10 spaces but do not take that for
granted in `generator` / `faradayInduction`, which you have not read.

### Why removal is correct (not "set a real unit")

- Categorical/text columns (e.g. a "Sensor position" or "Step A/B/C" column) must have no unit.
- Quantity columns in these labs either already carry the unit in the column label (e.g.
  "Voltage V (V)") or record a value the student reads directly off the PhET meter (units vary and
  are per-student randomized). Dropping the field is correct in both cases.
- Read each column before removing. If you find a quantity column with no unit in its label and a
  single unambiguous SI unit, setting `unit: '<unit>'` is acceptable instead of dropping. Removal is
  the safe default.

## Validation (must pass before done)

1. Format the touched files: `npx prettier --write <the 5 files>` (the own-line removals leave
   objects prettier will collapse; this keeps the repo format-clean).
2. Confirm zero remaining: `grep -c "Symbol(unevaluable)"` across the 5 files returns 0 each.
3. `npm run typecheck` clean.
4. `npm run lint` clean (warnings fail CI).
5. `npm run verify:lab` clean (0 errors, 0 warnings) for each lab. Use the **path** form, not the id,
   because these ids (`coulombsLaw`, `pointCharge`, `ohmsLaw`) collide with the PHY 114 copies:
   `npm run verify:lab -- src/content/labs/phy132/pointCharge.draft.lab.ts`, etc.

Note on environment: `npm run format:check` over the whole repo can report failures on untouched
files due to a known Windows CRLF artifact (CI/Linux is green). Do not be alarmed by that and do not
reformat unrelated files; only the 5 files you touched matter here.

## Notes for the agent

- `faradayInduction` and `generator` are the two halves of the split from the retired
  `magneticFieldFaraday` source draft and have **not** had a full verify-lab judgment review (only the
  deterministic checker). This handoff is scoped to the unit artifact only. If you notice other issues
  while in those files, flag them separately rather than expanding this cleanup.
- Keep the PR focused: one commit, "fix(labs): remove Symbol(unevaluable) unit artifact from enabled
  PHY 132 labs". Run `npm run ci` before opening it.
