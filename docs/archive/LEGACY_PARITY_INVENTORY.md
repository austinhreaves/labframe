# Legacy Parity Inventory

Source-of-truth mapping from `physics-labs.up.railway.app/{labs,phy_114}/<lab>/{labConfig.js,LabReportForm.js}` → new schema files under `src/content/labs/`. Generated from a full read of all 12 legacy labs on 2026-05-02. Reference for Phase 4 migration work; supersedes `SNELLS_PARITY_INVENTORY.md` (which can be deleted once this is signed off).

## Lab inventory

Twelve labs total. Five overlapping pairs (same `id`, present in both `labs/` and `phy_114/`), plus two singletons.

| Lab id | PHY 132 (`labs/`) | PHY 114 (`phy_114/`) | Overlap class |
|---|---|---|---|
| `snellsLaw` | ✓ | ✓ | Structural divergence |
| `staticElectricity` | ✓ | ✓ | Uncertainty-only divergence |
| `chargesFields` | ✓ | ✓ | Uncertainty-only divergence |
| `capacitors` | ✓ | ✓ | Structural divergence |
| `dcCircuits` | ✓ | ✓ | Structural divergence |
| `magneticFieldFaraday` | ✓ | — | Singleton (PHY 132 only) |
| `geometricOptics` | — | ✓ | Singleton (PHY 114 only) |

## The unifying divergence pattern

Across all five overlapping pairs, the difference between PHY 132 and PHY 114 follows one consistent rule: **PHY 132 includes uncertainty propagation; PHY 114 strips it.** This is the calculus-vs-algebra split between the two course tracks. On top of that, three of the five pairs (Snell's, capacitors, dcCircuits) carry additional structural divergence because the PHY 114 instructor used the simpler treatment as an opportunity to drop entire experiment parts and add or rebalance other sections.

Concretely:

- **Slope uncertainty fields** (`ΔA`, `σₘ`, etc.) and their corresponding answer keys (`*SlopeUncertainty`, `slopeUncertainty`, `uncertaintyA`, `uncertaintyAUnit`) appear only in PHY 132 versions.
- **Uncertainty calculation prose** (the "Step 2: Calculate the uncertainty in n₂" / "Propagate this uncertainty" questions) appears only in PHY 132.
- **Notation differs** in Snell's: PHY 132 uses `nₐ`/`nᵦ` subscripts; PHY 114 uses `n₂`. Same numbers, different glyphs.
- **Point values** are rebalanced in PHY 114 to absorb the dropped parts.

This is good news for the migration script: a single boolean flag (`--strip-uncertainty` or equivalent) handles ~60% of the diff. The remaining structural divergence still requires two distinct `*.lab.ts` files per pair.

## Recommendation: keep two files per overlapping pair

For all five pairs, the divergence is intentional and pedagogically meaningful, not a copy-paste accident. Each lab id needs **two** schema files:

```
src/content/labs/
├── phy132/
│   ├── snellsLaw.lab.ts            (already migrated — verify against §A below)
│   ├── staticElectricity.lab.ts    (TODO)
│   ├── chargesFields.lab.ts        (TODO)
│   ├── capacitors.lab.ts           (TODO)
│   ├── dcCircuits.lab.ts           (TODO)
│   └── magneticFieldFaraday.lab.ts (TODO — singleton)
└── phy114/
    ├── snellsLaw.lab.ts            (CURRENTLY WRONG — structural copy of phy132; replace)
    ├── staticElectricity.lab.ts    (TODO)
    ├── chargesFields.lab.ts        (TODO)
    ├── capacitors.lab.ts           (TODO)
    ├── dcCircuits.lab.ts           (TODO)
    └── geometricOptics.lab.ts      (TODO — singleton)
```

Twelve `.lab.ts` files total. Course manifests reference them by relative path.

## Per-pair diff details

### A. Snell's Law — STRUCTURAL DIVERGENCE

Existing `phy132/snellsLaw.lab.ts` was migrated from `labs/snellsLaw/`. Existing `phy114/snellsLaw.lab.ts` is a structural copy of phy132 with a TODO — must be rewritten from `phy_114/snellsLaw/`.

| Aspect | PHY 132 (`labs/`) | PHY 114 (`phy_114/`) |
|---|---|---|
| Part 1 Table 1 points | 1 | 1.5 |
| Part 1 sample calc points | 1 | 2 |
| Part 2 slope inputs | A + ΔA + units for both | A only |
| Part 2 uncertainty calculation question | yes (`part2_n2UncertaintyCalculation`) | absent |
| Part 3 slope inputs | A + ΔA | A only |
| Part 3 uncertainty analysis | yes | absent |
| Part 4 uncertainty range question | yes (`part4UncertaintyRangeQuestion`) | absent |
| Concept Check #4 ("real-world application") | absent (3 questions, 3 pts total) | present (4 questions, 5 pts total) |
| Discussion & Conclusion points | 6 | 5 |
| Notation for refraction medium | `nₐ` / `nᵦ` | `n₂` (no A/B subscript) |
| Total points | ~24 | ~24 |

**Lineage decision:** Two schema files. `phy132/snellsLaw.lab.ts` is already correct. `phy114/snellsLaw.lab.ts` must be regenerated — its current content is wrong (it's a copy of PHY 132 prose with PHY 114 metadata bolted on).

### B. Static Electricity & Coulomb's Law — UNCERTAINTY-ONLY DIVERGENCE

| Aspect | PHY 132 | PHY 114 |
|---|---|---|
| Part 2A slope | A + ΔA (with units for both) | A only |
| Part 2A "Record the slope" instruction | "Record the slope, A, and its uncertainty, ΔA (σₐ)." | "Record the slope, A." |
| Part 2B slope | A + ΔA | A only |
| Part 2B same instruction prose | with uncertainty | without |
| Everything else | identical prose, identical points, identical tables | — |

**Lineage decision:** Two schema files; PHY 114 differs from PHY 132 only in the slope MultiMeasurementField and one prose line each in Parts 2A and 2B.

### C. Charges & Electric Fields — UNCERTAINTY-ONLY DIVERGENCE

| Aspect | PHY 132 | PHY 114 |
|---|---|---|
| Part 1B slope MultiMeasurementField | `slopeValue` + `slopeUncertainty` (m + σₘ) | `slopeValue` only |
| Everything else | identical | — |

**Lineage decision:** Two schema files. The diff is one MultiMeasurementField config and four state keys (`slopeUncertainty`, `slopeUncertaintyUnit`).

### D. Capacitors — STRUCTURAL DIVERGENCE

| Aspect | PHY 132 | PHY 114 |
|---|---|---|
| Parts 1A, 1B, 1C | present (capacitor fundamentals + distance + area) | present, identical prose |
| Part 2A: Sharing Charges (3 parallel capacitors) | present | **absent** |
| Part 2B: Sharing Charges (series & parallel) | present | **absent** |
| `parallelCapacitorsImage`, `seriesParallelCapacitorsImage` | present | absent |
| `part2A.parallelCapacitors.tableData` (12 voltages × 3 caps × 3 steps) | present | absent |
| `part2B.seriesParallelCapacitors.tableData` (8 voltages) | present | absent |
| Imports `DARK_MODE_CLASSES` from `../../constants` | yes | no (literal array) |
| Point rebalancing in PHY 114 | — | calc 2→3, table 1→1.5, observation 1→2, concept checks 1.5→3 |
| Discussion points | 6 | 5 |

**Lineage decision:** Two schema files. PHY 114 is a strict subset of PHY 132's Parts 1A/1B/1C with point values redistributed across the kept sections.

### E. DC Circuits — STRUCTURAL DIVERGENCE

| Aspect | PHY 132 | PHY 114 |
|---|---|---|
| Part 1A (continuity, eraser/paper-clip/pencil) | present, 1.5 pts | present, 3 pts (rebalanced) |
| Part 1B Ohm's Law slope | A + ΔA | A only |
| Part 1B resistance calculation question count | 2 (resistance + uncertainty propagation) | 1 (resistance only, 3 pts) |
| Part 1C Ohm's Suggestion slope | A + ΔA | A only |
| Part 1C resistance calculation | yes (`resistanceCalculation1C`) | replaced with note: "No calculations are required for this graph." |
| Parts 1B & 1C concept checks | 4 questions, 4 pts | identical, 4 pts |
| Part 2A Kirchhoff (image, parameters table, measurements table, current law, voltage law) | present | present, points rebalanced (image 1→1.5, measurements 1→1.5, laws 1→1.5 each) |
| Part 2B: Power Delivery with Non-ideal Battery | **present** (image, power table, graph, custom fit A/B, batteryVoltageCalculation, sourceResistanceCalculation, maximumPowerTransferDerivation, Stereo System Problem 4-part) | **absent** |
| Discussion & Conclusion in LabReportForm | **absent** (bug — `discussionConclusion` is in answers state but no UI question renders it) | **present**, 5 pts |
| Power data initialization with pre-filled resistance values | yes | no (powerData not initialized in PHY 114 labConfig) |

**Lineage decision:** Two schema files. PHY 114 drops Part 2B entirely and adds the missing Discussion question. Also: **flag a likely bug in PHY 132** — discussion answer key exists but the LabReportForm doesn't render an input for it. Confirm with Austin whether that's intentional or a regression to fix during migration.

### F. Magnetic Field & Faraday's Law — SINGLETON (PHY 132 only)

Substantial calculus-based lab on magnetic dipole far-field, electromagnetic induction, and generator behavior.

- Part 1: Bar magnet field strength vs distance (12-row data table, derived 1/d³ column, three plots: B vs d, B vs 1/d³ unfitted, B vs 1/d³ with proportional fit), magnetic dipole moment calculation, three concept checks. **8 pts total.**
- Part 2: Pickup coil qualitative observations, three concept checks (speed, turns, area). **3 pts.**
- Part 3A: Generator effect of RPM (5-row data table with prefilled rotation values, peak EMF vs RPM plot with proportional fit). **2 pts + concept check 0.5 pts.**
- Part 3B: Effect of number of coil loops (4-row table with COIL_CONFIG.LOOP_VALUES prefilled, peak EMF vs loops plot). **2 pts + concept check 0.5 pts.**
- Part 3C: Effect of coil area (9-row table with COIL_CONFIG.AREA_VALUES prefilled, peak EMF vs area plot, three concept checks: 0.5 + 1 + 1.5 pts). **5 pts total in 3C.**
- Discussion & Conclusion: 4 pts.

**Migration note:** Imports `UNITS` and `COIL_CONFIG` from `../../constants`. Pre-filled column data needs to be hoisted into the schema as default row values; confirm `Lab` schema supports this (or extend it).

### G. Geometric Optics — SINGLETON (PHY 114 only)

Algebra-based optics lab on thin lenses.

- Part 1A: Convex lens qualitative parameters (RoC, n, D), three observations, two concept checks (real vs virtual). **3 pts observations + 2 pts concepts.**
- Part 1B: Convex lens quantitative — d₀, dᵢ, h₀, hᵢ measurements, screenshot, focal length calc via `1/f = 1/d₀ + 1/dᵢ`, magnification calc two ways. **1 + 1 + 2.5 pts.**
- Part 2A: Concave lens qualitative — same parameter inputs, two observations, two concept checks. **2 + 2 pts.**
- Part 2B: Concave lens quantitative — same measurement structure as 1B. **1 + 1 + 2.5 pts.**
- Part 3A: Principal vs marginal rays, three qualitative questions. **3 pts.**
- Part 4A (optional, +3 pts extra credit): Lens-Maker equation, theoretical focal lengths, percent error.
- Discussion & Conclusion: 5 pts.

**Migration note:** Uses `objective` as the answer key for the objective question, not `q1` like every other lab. Either preserve the inconsistency or normalize to `q1` and document the rename. Recommend normalize.

## Hidden gotchas the migration script must handle

These are the structural patterns that don't map 1:1 to the existing schema and need handling either in the script or in `Lab` schema extensions:

1. **Calculated columns with row-index-aware formulas.** `dcCircuits` powerData has the resistance column whose formula takes `(rowData, rowIndex)` and returns from a hardcoded array. Most other calculated columns only take `rowData`. The schema needs to support both signatures, or migrate the resistance values to defaults rather than a calc.

2. **Pre-filled row data.** `magneticFieldFaraday` Part 3B/3C tables are pre-populated with `COIL_CONFIG.LOOP_VALUES` and `COIL_CONFIG.AREA_VALUES`. `dcCircuits` Part 2B `powerData` has 15 prefilled resistances. Schema must support default row values per cell.

3. **Nested-object table data.** `capacitors` Part 2A/2B uses deeply nested keys like `part2A.parallelCapacitors.tableData.voltage1A`. The legacy code does `handleNestedDataChange('part2A.parallelCapacitors.tableData', key, value)` with dot-path traversal. The new schema either flattens these or supports nested paths — TBD.

4. **RecordTable with combined cells.** `capacitors` Part 2A and `dcCircuits` Part 2A use `{ type: 'combined', label: 'V₁ᴬ =', dataKey, unitKey }` cells where label, value, and unit live in one cell. Different from `{type: 'input'}` and `{type: 'header'}`.

5. **Cross-table data sharing.** `capacitors` Part 1B and 1C `RecordTable` reads from BOTH `answers.capacitorTableData` AND `answers.distanceComparisonData` (or `areaComparisonData`), with a routing `if (key in […])` to decide which sub-object to write to. Migration must preserve this or denormalize.

6. **`answers` itself used as `tableData`.** `dcCircuits` Part 2A passes `tableData={answers}` directly to `RecordTable`, then filters answers via `Object.fromEntries(...filter)`. This is a hack; new schema should use proper nested objects.

7. **Tables shared between simulation pages.** Several labs reference more than one PhET sim (`staticElectricity` has 3, `capacitors` has 2). The current `Lab.simulations` shape supports this but renderers will need to know which simulation belongs to which section.

8. **`enableEquationEditor: true` on free-text questions.** Used throughout for math entry. Schema's `kind: 'question'` needs to expose this flag.

9. **`integrityName_<labId>` per-lab field name.** Each lab uses a unique key (`integrityName_snellsLaw`, `integrityName_capacitors`, etc.) instead of a generic `integrityName`. Either generate per-lab via `${labId}` interpolation in the StudentInfo schema, or normalize.

10. **PHY 132 dcCircuits has no Discussion UI question** (answer key exists but no input renders it). Either a legacy bug or intentional. Flag for Austin during migration.

## Migration ordering suggestion (Stage 3)

Easiest → hardest, to shake out script bugs on simple labs first:

1. **chargesFields** (132 + 114) — simplest divergence (one MultiMeasurementField); good for testing the uncertainty-strip path.
2. **staticElectricity** (132 + 114) — second simplest; same pattern, slightly more sections.
3. **snellsLaw** (132 verify, 114 rewrite) — already partially migrated; good for confirming the script matches hand-migrated output.
4. **geometricOptics** (114 only) — singleton, no pair logic, but lots of MultiMeasurementField for parameter-and-measurement inputs.
5. **capacitors** (132 + 114) — structural divergence (2A/2B drop), nested table data, points rebalancing.
6. **dcCircuits** (132 + 114) — most complex: nested RecordTable patterns, Part 2B drop, custom-fit fields, stereo problem, possible Discussion bug.
7. **magneticFieldFaraday** (132 only) — singleton, but largest lab; pre-filled row data, three nested tables, multiple plots per data table.

## Storage key mapping

Each legacy lab declares a `labPdfConfig.storageKey` for `localStorage`. Per spec §5.13 these are slated to be dropped pre-launch. Listed here for completeness in case Austin wants to preserve any:

| Lab | Legacy storageKey |
|---|---|
| snellsLaw | `snells_law_answers` |
| staticElectricity | `static_electricity_coulombs_law_answers` |
| chargesFields | `charges_fields_answers` |
| capacitors | `capacitors_answers` |
| dcCircuits | `dc_circuits_answers` |
| magneticFieldFaraday | `magnetic_field_faradays_law_answers` |
| geometricOptics | `geometric_optics_answers` |

Default action per spec: drop all of these in the new app. Confirm or override.
