# Migration Script — `migrate-from-legacy.ts`

Reads a legacy lab directory (`physics-labs.up.railway.app/{labs,phy_114}/<lab>/`) and emits a draft `*.lab.ts` file targeting `src/domain/schema`. Companion to `LEGACY_PARITY_INVENTORY.md` and `REORG_PROPOSAL.md` at the repo root.

**Best-effort by design.** Every output gets manually reviewed. The script aims to nail structural skeleton, prose extraction, and the common derived-formula pattern, and marks fragile transformations with explicit `// TODO(human)` markers so review is fast.

## Setup

Run once after pulling these changes (new devDependencies were added):

```bash
npm install
```

This pulls `@babel/parser`, `@babel/traverse`, `@babel/types`, `@types/babel__traverse`, and `tsx`.

## Usage

```bash
npm run migrate -- --in <legacy-lab-dir> --out <output-file> [--strip-uncertainty]
```

Required:
- `--in <path>` — directory containing the legacy `labConfig.js` + `LabReportForm.js`
- `--out <path>` — output `.lab.ts` file path

Optional:
- `--strip-uncertainty` — flags slope-uncertainty fields for the PHY 114 transformation. Currently emits a warning header note only; full implementation deferred. For now, manually delete `*Uncertainty*` rows/sections per `LEGACY_PARITY_INVENTORY.md`.

The script auto-detects the course (`phy132` or `phy114`) from the output path and uses it to name the exported lab const (e.g., `phy132SnellsLawLab`).

## Examples

Migrate snellsLaw 132:

```bash
npm run migrate -- \
  --in physics-labs.up.railway.app/labs/snellsLaw \
  --out src/content/labs/phy132/snellsLaw.draft.lab.ts
```

Migrate the PHY 114 variant:

```bash
npm run migrate -- \
  --in physics-labs.up.railway.app/phy_114/snellsLaw \
  --out src/content/labs/phy114/snellsLaw.draft.lab.ts \
  --strip-uncertainty
```

Migrate all 12 legacy labs (bash):

```bash
for lab in snellsLaw staticElectricity chargesFields capacitors dcCircuits magneticFieldFaraday; do
  npm run migrate -- \
    --in "physics-labs.up.railway.app/labs/${lab}" \
    --out "src/content/labs/phy132/${lab}.draft.lab.ts"
done

for lab in snellsLaw staticElectricity chargesFields capacitors dcCircuits geometricOptics; do
  npm run migrate -- \
    --in "physics-labs.up.railway.app/phy_114/${lab}" \
    --out "src/content/labs/phy114/${lab}.draft.lab.ts" \
    --strip-uncertainty
done
```

Outputs are named `*.draft.lab.ts` so they don't accidentally get picked up by the renderer. Rename to `*.lab.ts` after review.

## What the script handles cleanly

| Legacy element | Mapped to | Notes |
|---|---|---|
| `metadata` (labConfig) | top-level `id`, `title`, `description`, `category` | Direct extraction |
| `simulations` (labConfig) | `Lab.simulations` | kebab-case keys converted to camelCase |
| `<StudentInfoSection>` | (absorbed into lab metadata) | Renderer auto-renders student info |
| `<ConfigurableQuestion>` with `mainTitle: 'OBJECTIVE'` | `objective` section with `fieldId: 'objective'` | Field id auto-normalized regardless of legacy `stateKey` |
| `<ConfigurableQuestion>` with `enableEquationEditor: true` | `calculation` section | One per inputArea |
| `<ConfigurableQuestion>` (other) | `concept` section | One per inputArea; total points distributed evenly (or by `(N pts)` markers if all areas have them and they sum to total) |
| `<MultiMeasurementField>` with one config item | `measurement` section | |
| `<MultiMeasurementField>` with N>1 config items | `multiMeasurement` section | |
| `<DataTable>` (input columns) | `dataTable` section | Units pulled from `unitValues` prop |
| `<DataTable>` derived columns matching the standard pattern | `dataTable` derived column with **fully translated formula**, inferred `deps`, extracted `precision` | See "Formula auto-translation" below |
| `<Graph>` (including when wrapped in a `<div id="...GraphContainer">`) | `plot` section | Default fits added when `enableFitting={true}`. Transparent HTML containers are now recursed correctly (was a v1 bug). |
| `<GenericImageUploader>` | `image` section | `captionFieldId` inferred from `imageKey` |
| Prose elements (`<h2>`, `<h3>`, `<p>`, `<ol>`, `<ul>`, `<sub>`, `<strong>`, etc.) | `instructions` section | Best-effort markdown conversion; consecutive prose grouped |

The script also:
- **Always emits** an Integrity Agreement instructions section at the top (`tocHidden: true`).
- **Always emits** a PDF Report Notes instructions section at the bottom (`tocHidden: true`).
- **Always emits** a deprecated alias export at the bottom: `export const <labId>Lab = <course><LabId>Lab;` for backward compatibility.
- **Cross-checks** every emitted `fieldId` against the lab's `initialAnswersState` and warns on mismatches.
- **Runs prettier** on the output before writing, so the file matches project style (single-quote, 2-space indent, etc.) automatically.

## Formula auto-translation

The script detects the most common legacy derived-column shape:

```js
formula: (rowData) => {
  const X = parseFloat(rowData.COL);
  if (!isNaN(X)) {           // optional: && more conditions
    return EXPR.toFixed(N);  // optional: just `return EXPR;`
  }
  return '';
}
```

and translates it to:

```ts
formula: (row: NumericRow): number => {
  const X = row.COL ?? 0;
  return EXPR;
}
```

with `deps: ['COL']` and `precision: N` extracted automatically. The `formulaLabel` field is also emitted (defaulting to the column's `label`).

Formulas that don't match this exact shape (multiple input columns, complex conditionals, references to outer-scope state, etc.) get a warning and the original legacy source is dropped in as a comment with a stub `formula: (_row) => 0, // TODO(human)`. Hand-port those.

## What the script flags as TODO(human)

| Pattern | What you'll see | Why |
|---|---|---|
| Derived column formulas that don't match the auto-translation pattern | TODO comment with the legacy source verbatim, plus a stub formula | Pattern matcher requires the standard `parseFloat → isNaN → toFixed` shape |
| `<RecordTable>` (chargesFields, capacitors, dcCircuits) | An `instructions` block with TODO text | RecordTable's combined-cell layout doesn't map cleanly to the current schema; hand-port |
| Nested-object table data (capacitors Part 2A/2B) | TODO instructions | The deeply nested `part2A.parallelCapacitors.tableData` shape needs schema design decisions before migration |
| Pre-filled row values (magneticFieldFaraday Part 3B/3C, dcCircuits Part 2B power table) | Plain `dataTable` with no defaults | Schema doesn't currently support default cell values; either extend the schema or hand-port the prefills |
| Multi-prompt ConfigurableQuestion with explicit "(N pts)" markers in labels | If markers sum to total, used as-is. If not, even-distributed without warning | Manually verify point distribution matches your intent |
| `<ConfigurableQuestion>` without recognizable structure | `'⚠️ TODO(human): missing prompt'` | Edge cases not seen in the 12 sampled labs |
| Unknown components | `'⚠️ TODO(human): legacy used <Foo>. Port manually.'` | Future-proof against legacy patterns I didn't sample |

All warnings (including fieldId mismatches and unrecognized formulas) are also collected and emitted as a comment block at the top of the output file.

## Known limitations

1. **Uncertainty-strip transform (`--strip-uncertainty`) is flag-only.** The header gets a warning but uncertainty fields/sections are not removed. Manually delete the slope-uncertainty `multiMeasurement` rows and any `*Uncertainty*` calculation sections per `LEGACY_PARITY_INVENTORY.md`.
2. **Single-pass walk.** The script does not re-order sections or fold related ones. Output order matches legacy JSX order one-to-one.
3. **Markdown conversion is approximate.** Inline `<sub>`, `<sup>`, and `<code>` are preserved as inline HTML in the output. Lists work for simple cases; nested lists may need cleanup.
4. **Single source file expected.** The script reads `labConfig.js` and `LabReportForm.js` from the input directory only. Does not follow imports into shared component files.
5. **Boilerplate is fixed.** The Integrity Agreement and PDF Report Notes sections are emitted with hard-coded copy. Edit the constants at the top of "Phase 4" in the script if you need different default wording.

## Verification workflow

After running migration:

```bash
# 1. Find every TODO marker
grep -n "TODO(human)" src/content/labs/phy132/snellsLaw.draft.lab.ts

# 2. Cross-check against legacy parity inventory
# (see LEGACY_PARITY_INVENTORY.md per-lab section for what to expect)

# 3. Lint and typecheck the draft
npx eslint src/content/labs/phy132/snellsLaw.draft.lab.ts
npm run typecheck

# 4. Once reviewed and TODOs resolved, rename:
mv src/content/labs/phy132/snellsLaw.draft.lab.ts src/content/labs/phy132/snellsLaw.lab.ts

# 5. Add the lab to the appropriate course manifest with enabled: true
```

## Per-lab expected difficulty (post v2 improvements)

| Lab | Expected cleanup | Why |
|---|---|---|
| snellsLaw | Very light | Derived sin formulas auto-translate; plots auto-emit; boilerplate auto-added. Mainly point-value tweaks and pedagogical adjustments. |
| staticElectricity | Very light | Single derived column (1/d) auto-translates |
| chargesFields | Medium | RecordTable usage in Part 1A doubling subsections → TODO blocks |
| capacitors (132) | Heavy | Parts 2A/2B nested table data → TODO blocks |
| capacitors (114) | Light-medium | RecordTable comparison tables |
| dcCircuits (132) | Heavy | Part 2A RecordTable, Part 2B prefilled power data, multi-area Stereo problem |
| dcCircuits (114) | Medium | Part 2A RecordTable; no Part 2B |
| magneticFieldFaraday | Heavy | Three pre-filled tables (Part 3A/3B/3C), `RecordTable` in constant-parameter blocks |
| geometricOptics | Very light | No tables, no derived columns |

## Architecture (for future maintainers)

The script is a single file at `scripts/migrate-from-legacy.ts`, organized into pipeline phases:

1. **CLI parsing** (`parseArgs`)
2. **Babel parsing** of `labConfig.js` and `LabReportForm.js` into ASTs (with original source kept for slice-based formula extraction)
3. **Phase 1: labConfig extraction** — walk top-level `const` declarations into a symbol table, then read `metadata`, `simulations`, `initialAnswersState`
4. **Phase 2: LabReportForm walk** — find `<BaseLabWrapper>`, dispatch each child to a per-component handler. Transparent HTML containers (div/span/section/article) get recursed when they contain React components.
5. **Phase 3: validation** — cross-check `fieldId`s against `initialAnswersState`
6. **Phase 4: emission** — wrap sections with Integrity + PDF boilerplate, write hand-formatted TS, run prettier, write to disk

### Adding a new component handler

Add to the `COMPONENT_HANDLERS` map; write the handler with signature `(el: t.JSXElement, ctx: WalkContext) => Section[]`.

### Extending formula auto-translation

`tryTranslateFormula(fnNode, rawSource)` is the matcher. It currently recognizes the canonical `parseFloat → isNaN → toFixed` shape with one source column. To handle more patterns:
- Multi-column formulas: relax the `body.length` check, accept multiple `const X = parseFloat(rowData.Y)` decls, return `deps` as an array of all referenced cols.
- Different math wrappers (e.g., `Number()` instead of `parseFloat()`): add another callee name check.
- Different return shapes: handle `parseFloat(EXPR).toFixed(N)`, `EXPR`, ternary returns, etc.

### Symbol table / literal evaluator

`evalNode` best-effort evaluates AST nodes into JS values; functions get wrapped as `{ __fn: true, node }` so handlers can pattern-match the AST later. Identifiers are resolved through the symbol table built in earlier passes. If you see `unknown_<n>` fieldIds in output, extend `evalNode` rather than working around in handlers.
