# PHY 112 Course Buildout: Tier A + B Implementation Spec

**Status:** Draft for review. No code written yet.
**Author:** Prepared with Claude, 2026-05-22.
**Scope:** Add a new `phy112` course to LabFrame and author 8 labs converted from the PHY 112 recitation exercise keys.

---

## 1. Purpose

PHY 112 is the algebra-based second-semester introductory physics course (electricity, magnetism, optics). It currently exists only as a set of paper recitation exercises. This spec covers porting 8 of the 13 recitations into LabFrame, grouped by how cleanly they map onto the platform:

- **Tier A (3 labs):** already simulation-based recitations. Conversion is near-transcription.
- **Tier B (5 labs):** currently paper problem sets. Each gets a PhET simulation layer so it becomes a build-and-verify investigation rather than a static problem set.

The remaining 5 recitations (ex01, ex02, ex03, ex08, ex09) are out of scope here and tracked separately.

---

## 2. Source materials

Recitation keys live in the connected folder:

```
PHY 112 Instructional Materials-20260307T231627Z-1-001/PHY 112 Instructional Materials/
  phy112_rec_ex04_soln.docx ... phy112_rec_ex13_soln.docx
```

### Caveats every implementing agent must respect

1. **These docx files are SOLUTION KEYS.** Every file is marked `KEY` and contains the correct answers inline. The LabFrame lab is the *student-facing worksheet*. Strip all answer text. Keep only: titles, theory/background, procedure, prompts, table skeletons, and point values.
2. **Embedded figures come from the keys.** Circuit diagrams in ex04 to ex07 and the field/ray diagrams in ex10/ex11 are marked up with answer annotations (`+`/`-` plate labels, current-direction arrows, etc.). Extracted figures must be reviewed and, where annotated, replaced with clean versions before use. Flagged as an open question for Austin (Section 9).
3. **Algebra-based.** No calculus. Keep derivations and hints at the algebra-based level. Do not copy math framing from the calculus-based `phy132` labs.

---

## 3. How LabFrame is structured (orientation for implementing agents)

A **Lab** is a typed object (`Lab` from `@/domain/schema`, defined in `src/domain/schema/lab.ts`). It has an `id`, `title`, `description`, `category`, a `simulations` map, and an ordered `sections` array.

A **Course** (`src/domain/schema/course.ts`) lists labs by `ref` with a `labNumber` and an `enabled` flag.

### File layout (follow the existing `phy114` pattern exactly)

```
src/content/labs/phy112/<name>.lab.ts      <- one file per lab, exports `phy112<Name>Lab: Lab`
src/content/labs/index.ts                  <- re-export each lab (prefixed name)
src/content/courses/phy112.course.ts       <- new Course object
src/content/courses/index.ts               <- re-export the course
public/phy112/                  <- extracted figure assets (Vite static dir; does not exist yet)
```

### Section kinds available (from `lab.ts`, discriminated union on `kind`)

| kind | use for | key fields |
|---|---|---|
| `instructions` | theory, procedure, headers | `html`, optional `points`, `tocHidden`, `tocLabel` |
| `objective` | "state the goal" free response | `fieldId`, `prompt`, `rows`, `points` |
| `measurement` | one labelled numeric reading | `fieldId`, `label`, `unit`, `points` |
| `multiMeasurement` | several labelled readings as named rows | `rows[]` of `{id,label,unit}`, `points` |
| `dataTable` | repeated numeric rows; supports `derived` formula columns | `tableId`, `columns[]`, `rowCount`, `points` |
| `plot` | scatter of two table columns with curve fits | `plotId`, `sourceTableId`, `xCol`, `yCol`, labels, `fits[]` |
| `image` | student uploads a photo/drawing with a caption | `imageId`, `captionFieldId`, `maxMB`, `points` |
| `calculation` | show-your-work response, optional equation editor | `fieldId`, `prompt`, `equationEditor`, `points` |
| `concept` | free-text conceptual answer | `fieldId`, `prompt`, `rows`, `points` |

Note on `instructions` content: despite the field being named `html`, it is rendered as **Markdown** (`react-markdown` with `remark-gfm`, `remark-math`/KaTeX, and `rehype-sanitize`). Authoring is Markdown: `##`/`####` headers, `---` rules, `[!WARNING]` callouts, GitHub-flavored tables. Raw HTML is sanitized. See the figure note (D5) for how images work.

Note on tables: `dataTable` columns must be numeric (`input` or `derived`). The recitation voltage-drop tables have *named element rows* (Battery, C1, C2), not repeated numeric rows. Those map to **`multiMeasurement`**, not `dataTable`. Use `dataTable` only where a column of like readings repeats (e.g. ex11 angle sweeps, ex06 voltmeter walk).

### House style (from existing labs and Austin's conventions)

- No em dashes anywhere in authored content.
- Use a horizontal rule (`---`) in `instructions` HTML before any preambled prompt and to chunk dense background blocks.
- Observation prompts stay terse ("Briefly describe what you observed.").
- JIT theory: place background immediately before the procedure it supports, not in a lump at the top.
- Every lab opens with the integrity-agreement `instructions` block and closes with the PDF-report-notes block (both `tocHidden: true`). Copy these verbatim from `src/content/labs/phy114/capacitors.draft.lab.ts`.

---

## 4. Key design decisions (review before building)

**D1. Tier A AC sim URL.** The recitations specify the *Virtual Lab* variant of the AC kit (it has the draggable meter toolbox). The existing `phy114/capacitors` lab embeds the plain `circuit-construction-kit-ac`. Tier A must use:
`https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_all.html`

**D2. Tier B is augmented, not transcribed.** ex07, ex10, ex12, ex13 are analytic problems with no simulation in the source. This spec adds a PhET layer so each becomes a predict-then-verify lab: students solve analytically with `calculation` blocks, then build/measure in the sim and reconcile. This is a pedagogical change from the paper originals. If Austin wants strict parity instead, drop the sim sections and these become calculation-only labs (still valid, less LabFrame value). See Section 9.

**D3. Three separate AC labs, not one.** Per Austin's decision, ex04/05/06 stay 1:1 with the recitations (three files, three course entries). They share one `simulations` entry definition (copy it into each file).

**D4. Optics labs stay separate.** ex11, ex12, ex13 are three independent labs per Austin's decision.

**D5. Figures.** There is no dedicated figure section kind, and no existing lab embeds an authored image (the migrated `phy114`/`phy132` labs lean entirely on the sim). So there is no precedent to copy. The mechanism this spec assumes:

- Figure files live in `public/phy112/` (Vite serves `public/` at the site root; the directory does not exist yet and Chunk 0 creates it).
- They are referenced from `instructions` blocks using Markdown image syntax with a root-relative path: `![Part I circuit](/phy112/ex04_part1.png)`.
- `rehype-sanitize`'s default schema allows `img` with a relative `src`, so this should survive sanitization. This is unverified against a running build, so Chunk 0 includes a render smoke-test, and if `img` is stripped the fallback is to widen the sanitize schema (a small `src/ui/primitives/MarkdownBlock.tsx` change, tracked as a separate ticket).

Chunk 0 extracts the figures; clean (un-annotated) source review is an open question (Section 9).

---

## 5. The 8 labs at a glance

| # | Recitation | Lab `id` | Course `ref` | labNumber | Simulation |
|---|---|---|---|---|---|
| Tier A | ex04 | `capacitorsSeriesParallel` | same | 1 | CCK: AC Virtual Lab |
| Tier A | ex05 | `resistorsSeriesParallel` | same | 2 | CCK: AC Virtual Lab |
| Tier A | ex06 | `kirchhoffsRules` | same | 3 | CCK: AC Virtual Lab |
| Tier B | ex07 | `dcCircuitAnalysis` | same | 4 | CCK: DC |
| Tier B | ex10 | `magneticFluxInduction` | same | 5 | Faraday's EM Lab (HTML5 port; see Chunk 5) |
| Tier B | ex11 | `refractionAndTIR` | same | 6 | Bending Light |
| Tier B | ex12 | `mirrors` | same | 7 | Geometric Optics |
| Tier B | ex13 | `lenses` | same | 8 | Geometric Optics |

`labNumber` ordering follows the recitation sequence. Tier B `enabled` may stay `false` until the sim layer is reviewed (D2).

---

## 6. Chunk breakdown and dependency graph

Ten chunks. Chunk 0 must finish first. Chunks 1 to 8 are mutually independent (each touches only its own new lab file) and can run in parallel. Chunk 9 runs last.

```
        C0  Scaffold + figure extraction
        |
   +----+----+----+----+----+----+----+----+
   C1   C2   C3   C4   C5   C6   C7   C8      (8 labs, parallel)
   +----+----+----+----+----+----+----+----+
        |
        C9  Wire-up + verification
```

Why this shape: shared files (`labs/index.ts`, `courses/phy112.course.ts`, `courses/index.ts`) are written only by C0 (creates them) and C9 (final wire-up). The 8 lab chunks each create exactly one new file and touch nothing shared, so no merge conflicts. Each lab file is an independently-valid TS module, so `tsc --noEmit` will typecheck it even before C9 wires the exports.

---

## 7. Chunk 0: Scaffold + figure extraction

**Files:** create `src/content/courses/phy112.course.ts`; edit `src/content/courses/index.ts`; create empty `src/content/labs/phy112/` dir; extract figures into `public/phy112/`. Do NOT create lab files. Leave `labs/index.ts` untouched (C9 wires lab exports).

The course object lists all 8 labs but with `enabled: false` for now (C9 flips them on after the files exist and typecheck).

### Agent handoff prompt: Chunk 0

> You are setting up the scaffolding for a new course, `phy112`, in the LabFrame repo at `C:\Users\ahreaves\labframe`. LabFrame is a physics-lab authoring platform; labs and courses are typed TypeScript objects.
>
> Do these three things:
>
> 1. **Create the course file** `src/content/courses/phy112.course.ts`. Model it exactly on `src/content/courses/phy114.course.ts` (read that file first). Export `phy112Course: Course`. Use `id: 'phy112'`, `title: 'PHY 112'`, `storagePrefix: 'phy112'`, `parentOriginAllowList: ['https://canvas.asu.edu']`. The `labs` array must list all 8 labs in this order, each with `enabled: false` for now: `capacitorsSeriesParallel` (labNumber 1), `resistorsSeriesParallel` (2), `kirchhoffsRules` (3), `dcCircuitAnalysis` (4), `magneticFluxInduction` (5), `refractionAndTIR` (6), `mirrors` (7), `lenses` (8). The `ref` equals the lab id in every case.
>
> 2. **Register the course:** add `export * from './phy112.course';` to `src/content/courses/index.ts`.
>
> 3. **Extract figures.** The 8 source recitation keys are `.docx` files in the connected folder `PHY 112 Instructional Materials-20260307T231627Z-1-001/PHY 112 Instructional Materials/` (files `phy112_rec_ex04_soln.docx`, `ex05`, `ex06`, `ex07`, `ex10`, `ex11`; ex12 and ex13 have no figures). A `.docx` is a zip; embedded images live under `word/media/`. Extract every image, create the directory `public/phy112/`, and save them with descriptive names grouped by exercise (e.g. `ex04_part1_single_capacitor.png`). Produce a short manifest file `public/phy112/FIGURES.md` listing each extracted image, which recitation part it belongs to, and a one-line description.
>
> Important: these docx files are answer keys. The figures are very likely annotated with solution markings (plus/minus plate labels, current-direction arrows). In `FIGURES.md`, flag every figure that appears to carry answer annotations so a clean replacement can be sourced. Do not edit the images.
>
> 4. **Image render smoke-test.** No existing lab embeds an authored image, so confirm the mechanism works before the lab chunks rely on it. The `instructions` section renders its content as Markdown through `src/ui/primitives/MarkdownBlock.tsx`, which runs `rehype-sanitize`. Temporarily add a Markdown image reference (`![test](/phy112/<some-extracted-file>.png)`) to any lab or a scratch render, start the dev server, and confirm the image displays and is not stripped by the sanitizer. Record the result in `FIGURES.md`. If `img` is stripped, note it: the lab chunks will then need a sanitize-schema change in `MarkdownBlock.tsx` (allow `img` with relative `src`), which should be opened as its own ticket. Revert the temporary test edit.
>
> Do not create any lab files and do not modify `src/content/labs/index.ts`. When done, run `npx tsc --noEmit` and confirm the course file typechecks. Report the figure manifest, the image render-test result, and any annotated-figure warnings.

---

## 8. Chunks 1 to 3: Tier A labs

All three Tier A labs share this `simulations` entry (copy verbatim into each file):

```ts
simulations: {
  circuitConstructionKitAcVirtualLab: {
    title: 'Circuit Construction Kit: AC - Virtual Lab',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_all.html',
    allow: 'fullscreen',
  },
},
```

Common structure for every lab: integrity-agreement `instructions` (tocHidden) -> sim-setup `instructions` -> the recitation Parts in order -> PDF-report-notes `instructions` (tocHidden). Copy the integrity and PDF blocks verbatim from `phy114/capacitors.draft.lab.ts`.

### Chunk 1: ex04 -> `capacitorsSeriesParallel`

Source: `phy112_rec_ex04_soln.docx`. Topic: capacitor voltage drops and charge in series vs parallel.

Section outline (docx Part -> schema):

- Sim setup `instructions`: the "Run the Circuit Construction Kit" paragraphs + the battery-symbol and "tiny" resistivity settings. Note students need only wire/battery/capacitor.
- Part I `instructions` + JIT theory (battery terminal convention, voltmeter lead placement) + figure.
- `multiMeasurement` rows `[p1BatteryV, p1CapacitorV]` (Measured Voltage Drop), 2 pts.
- `concept` `p1VoltageCompare`: "How does the voltage drop across the battery compare to the capacitor?", 1 pt.
- Part II `instructions` + figure (two caps in series).
- `multiMeasurement` rows `[p2BatteryV, p2C1V, p2C2V]`, 2 pts.
- `concept` `p2VoltagePattern`, 2 pts.
- `calculation` `p2ChargeCalc` (`equationEditor: true`): compute Q = C*deltaV for each capacitor, 2 pts.
- `concept` `p2ChargeCompare`, 1 pt.
- Part III `instructions` + figure (two caps in parallel).
- `concept` `p3LoopsDescription`: describe the three independent loops, 2 pts.
- `multiMeasurement` rows `[p3BatteryV, p3C1V, p3C2V]`, 2 pts.
- `concept` `p3VoltagePattern`, 1 pt.
- `calculation` `p3ChargeCalc` (`equationEditor: true`), 1 pt.
- `concept` `p3ChargeCompare`, 1 pt.
- Part IV `instructions` (conclusion + significant-figures note).
- `concept` `p4Summary`: the four "the same / different" fill-ins (series voltage, series charge, parallel voltage, parallel charge), 1 pt.
- Part V `instructions` + figure (three-capacitor follow-up circuit).
- `multiMeasurement` rows `[p5BatteryV, p5C1V, p5C2V, p5C3V]`.
- `calculation` `p5ChargeCalc`: charge on C1, C2, C3.
- `concept` `p5SeriesParallelId`: are C1&C2 parallel, C1&C3 parallel, C2&C3 series; describe voltage patterns, 1 pt.
- `image` section `imageId: p5FourthCapacitor`, `captionFieldId: p5FourthCapacitorCaption`: student annotates where a 4th capacitor goes to be parallel with C1, 1 pt.

**Agent handoff prompt: Chunk 1**

> Create a new LabFrame lab file `src/content/labs/phy112/capacitorsSeriesParallel.lab.ts` exporting `phy112CapacitorsSeriesParallelLab: Lab` with `id: 'capacitorsSeriesParallel'`.
>
> The lab is a student-facing conversion of recitation exercise 4. Source key: `phy112_rec_ex04_soln.docx` in the connected folder `PHY 112 Instructional Materials-20260307T231627Z-1-001/PHY 112 Instructional Materials/`. The docx is an ANSWER KEY: read it for structure, theory text, procedure, prompts and point values, but strip every answer. The student worksheet must contain no solutions.
>
> Read `src/content/labs/phy114/capacitors.draft.lab.ts` first to learn the exact `Lab` shape, the integrity-agreement opening block, the PDF-report-notes closing block, and house style. Read `src/domain/schema/lab.ts` for the section schema.
>
> Build the sections following the outline in `docs/PHY112_TIER_AB_SPEC.md` Section 8, Chunk 1. Use the shared `circuitConstructionKitAcVirtualLab` simulation entry given there. Use `multiMeasurement` for the voltage-drop tables (named element rows), `calculation` with `equationEditor: true` for the Q = C*deltaV charge work, `concept` for comparisons and pattern questions, and an `image` section for the Part V "draw the fourth capacitor" task. Preserve the per-question point values from the docx. Embed the Part I/II/III/V circuit diagrams in `instructions` blocks using Markdown image syntax with a root-relative path, `![Part I circuit](/phy112/<filename>.png)`, against the figures Chunk 0 extracted to `public/phy112/` (check `FIGURES.md` for filenames and the image render-test result; if a figure is flagged as answer-annotated, still reference it but add a `TODO(human)` note beside it).
>
> House style: no em dashes; terse observation prompts; JIT theory placed right before the procedure it supports; `---` rules before preambled prompts. Field IDs are camelCase and unique within the lab (the spec lists suggested IDs). Do not modify `src/content/labs/index.ts` or any course file. When done, run `npx tsc --noEmit` and confirm the new file typechecks.

### Chunk 2: ex05 -> `resistorsSeriesParallel`

Source: `phy112_rec_ex05_soln.docx`. Topic: resistor voltage drops and currents in series vs parallel; voltmeter-vs-ammeter placement.

Section outline:

- Sim setup `instructions` (wire/battery/resistor only).
- Part I `instructions` + figure (single resistor).
- `multiMeasurement` `[p1BatteryV, p1ResistorV]`, 2 pts.
- `concept` `p1VoltageCompare`, 1 pt.
- `instructions` + figure for the resistor E-field question.
- `image` `p1FieldDiagram` / caption `p1FieldDiagramCaption`: student draws and labels E-field direction and positive-charge motion; with terse `concept` sub-prompts `p1FieldDirection` and `p1ChargeDirection` for the brief explanations, 2 pts total.
- `multiMeasurement` `[p1CurrentBefore, p1CurrentAfter]` (ammeter before/after resistor), part of the 2 pts; plus `concept` `p1ChargeConservation`.
- Part II `instructions` + figure (two resistors in series).
- `multiMeasurement` `[p2BatteryV, p2R1V, p2R2V]`, 2 pts.
- `concept` `p2VoltagePattern`, 1 pt.
- `multiMeasurement` `[p2R1Current, p2R2Current]`, 1 pt.
- `concept` `p2CurrentCompare`, 1 pt.
- Part III `instructions` + figure (two resistors in parallel).
- `concept` `p3LoopsDescription`, 1 pt.
- `multiMeasurement` `[p3BatteryV, p3R1V, p3R2V]`, 2 pts.
- `concept` `p3VoltagePattern`, 1 pt.
- `multiMeasurement` `[p3BatteryCurrent, p3R1Current, p3R2Current]`, 1 pt.
- `concept` `p3NodeRule`: current into node = sum out; charge conservation, 1 pt.
- Part IV `instructions`.
- `concept` `p4Summary`: four "same/different" fill-ins (series voltage, series current, parallel voltage, parallel current), 1 pt.
- `concept` `p4MeterPlacement`: voltmeter in parallel, ammeter in series, 1 pt.

**Agent handoff prompt: Chunk 2**

> Create `src/content/labs/phy112/resistorsSeriesParallel.lab.ts` exporting `phy112ResistorsSeriesParallelLab: Lab` with `id: 'resistorsSeriesParallel'`. This is a student-facing conversion of recitation exercise 5 (source key `phy112_rec_ex05_soln.docx` in the connected PHY 112 folder; it is an ANSWER KEY, strip all answers).
>
> Follow the same process as the other Tier A labs: read `src/content/labs/phy114/capacitors.draft.lab.ts` for the `Lab` shape, integrity/PDF blocks and house style; read `src/domain/schema/lab.ts` for the schema. Build sections per `docs/PHY112_TIER_AB_SPEC.md` Section 8, Chunk 2. Use the shared `circuitConstructionKitAcVirtualLab` sim entry. Use `multiMeasurement` for all voltage-drop and current tables, `concept` for comparisons/patterns, and `image` sections for the tasks that ask the student to draw and label field/current directions on a resistor diagram. Preserve per-question points from the docx. Embed circuit figures in `instructions` blocks using Markdown image syntax with a root-relative path, `![...](/phy112/<filename>.png)` (see `FIGURES.md`; add a `TODO(human)` note beside any answer-annotated figure).
>
> House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done and confirm it typechecks.

### Chunk 3: ex06 -> `kirchhoffsRules`

Source: `phy112_rec_ex06_soln.docx`. Topic: Kirchhoff loop and junction rules, voltmeter walk around loops, a multiloop circuit.

Section outline:

- Sim setup `instructions`.
- Part I `instructions` + figure: build R1=50, R2=75 in series; explain the voltmeter-walk method.
- `dataTable` `tableId: 'loopWalkTable'`, `rowCount: 7`, columns: `redLeadLocation` (input, the a-f-a positions; this is the one place a repeated-row table fits), `voltmeterReading` (input, unit V), `riseDropUnchanged` (input), `amountOfChange` (input, unit V). 5 pts. Note: `redLeadLocation` and `riseDropUnchanged` are text-valued; if `dataTable` columns reject non-numeric input, fall back to a fixed `multiMeasurement` set or an `instructions` table skeleton plus per-row measurements. Flag the choice in a `TODO(human)` note.
- `concept` `p1LoopSum`: sum of rises and drops around the loop, 1 pt.
- `concept` `p1RiseDropRules`: three fill-ins (battery low-to-high, wire, resistor with current), 3 pts.
- `concept` `p1ReverseRules`: three fill-ins for the reverse traversal, 3 pts.
- Part II `instructions` + figure: R1, R2 in parallel.
- `concept` `p2MultiLoopSum`: conclusion about voltage sums around the three loops abcfa, abcdefa, fcdef, 3 pts.
- Part III `instructions`: the Kirchhoff's rules summary text (loop rule from energy conservation, junction rule from charge conservation). Pure background, no prompt.
- Part IV `instructions` + figure: the multiloop circuit with two batteries (5.00 V, 25.0 V) and R1=40, R2=10, R3=80.
- `multiMeasurement` for the measured values: `[p4Batt1V, p4Batt2V, p4R1V, p4R2V, p4R3V, p4R1I, p4R2I, p4R3I]`, 4 pts. Alternatively a `dataTable` keyed by component if non-numeric labels are acceptable; otherwise multiMeasurement.
- `concept` `p4ParallelCheck`: are the three resistors in parallel, and why, 1 pt.

**Agent handoff prompt: Chunk 3**

> Create `src/content/labs/phy112/kirchhoffsRules.lab.ts` exporting `phy112KirchhoffsRulesLab: Lab` with `id: 'kirchhoffsRules'`. Student-facing conversion of recitation exercise 6 (source key `phy112_rec_ex06_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers).
>
> Follow the Tier A process: read `src/content/labs/phy114/capacitors.draft.lab.ts` and `src/domain/schema/lab.ts` first. Build sections per `docs/PHY112_TIER_AB_SPEC.md` Section 8, Chunk 3. Use the shared `circuitConstructionKitAcVirtualLab` sim entry.
>
> Special attention: Part I has a voltmeter-walk table with seven rows and mixed text/numeric columns (lead location, reading, rise/drop/unchanged, amount). Try `dataTable` first; if the schema's `dataTable` columns reject text values, fall back to a `multiMeasurement` block or a Markdown table skeleton in an `instructions` block plus measurement fields, and leave a `TODO(human)` note explaining the choice. Part III is pure background text (the Kirchhoff's-rules summary) with no student prompt. Preserve per-question points. Embed circuit figures in `instructions` blocks using Markdown image syntax, `![...](/phy112/<filename>.png)`, per `FIGURES.md`.
>
> House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` and confirm it typechecks.

---

## 9. Chunks 4 to 8: Tier B labs

Tier B exercises are analytic in the source. Each lab is built in two layers (see decision D2):

- **Analytic core** (faithful to the docx): `calculation` and `concept` sections where the student solves the problem.
- **Simulation verification layer** (added value): a PhET sim plus `instructions` and `concept`/`measurement` sections where the student reproduces the scenario and reconciles measured with calculated values.

If Austin rejects D2, the verification layer is dropped and the lab is calculation-only.

### Chunk 4: ex07 -> `dcCircuitAnalysis`

Source: `phy112_rec_ex07_soln.docx`. Topic: solve a 5-resistor network for the missing resistance, all currents and all voltages; then reverse-engineer a circuit from a table of values.

Simulation:

```ts
simulations: {
  circuitConstructionKitDc: {
    title: 'Circuit Construction Kit: DC',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
    allow: 'fullscreen',
  },
},
```

Section outline:

- Integrity `instructions`.
- Problem 1 `instructions` + figure: the 5-resistor circuit; give the partial table (R2, R3, R4, R5, battery voltage, current in R3 known; R1 and all other currents/voltages unknown).
- `calculation` `prob1Analysis` (`equationEditor: true`): find R1 and complete the table, explaining each step (series/parallel reduction, loop rule). 10 pts.
- Verification layer: `instructions` to build the circuit in CCK: DC with the known values; `multiMeasurement` `[verifyR1, verifyR2I, verifyR5I, ...]` for measured values; `concept` `prob1Reconcile`: do measured and calculated agree.
- Problem 2 `instructions`: given a table of currents, voltages and resistances for 4 resistors plus a battery, draw a consistent circuit.
- `image` `prob2CircuitDrawing` / caption `prob2CircuitCaption`: student uploads their drawn circuit, 10 pts.
- `calculation` `prob2Explanation` (`equationEditor: true`): explain how the drawing was constructed.
- Verification layer: `instructions` to build the student's proposed circuit in CCK: DC and confirm it reproduces the table; `concept` `prob2Reconcile`.

**Agent handoff prompt: Chunk 4**

> Create `src/content/labs/phy112/dcCircuitAnalysis.lab.ts` exporting `phy112DcCircuitAnalysisLab: Lab` with `id: 'dcCircuitAnalysis'`. Student-facing conversion of recitation exercise 7 (source key `phy112_rec_ex07_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers including the completed table values).
>
> This is a Tier B lab: the source is a paper problem set, and this conversion adds a Circuit Construction Kit: DC simulation verification layer (predict analytically, then build and measure). Read `docs/PHY112_TIER_AB_SPEC.md` Section 9 decision D2 and Chunk 4 outline for the two-layer structure. Read `src/content/labs/phy114/dcCircuits.draft.lab.ts` for the CCK: DC sim entry and the `Lab` shape, and `src/content/labs/phy114/capacitors.draft.lab.ts` for the integrity/PDF blocks and house style. Read `src/domain/schema/lab.ts` for the schema.
>
> Build the two problems as specified: Problem 1 is the 5-resistor network (a `calculation` with `equationEditor: true` for the analytic solve, then a build-and-measure verification block); Problem 2 asks the student to draw a circuit consistent with a value table (an `image` upload for the drawing plus a `calculation` explanation, then a sim verification block). Keep the partial given-table as a Markdown table in an `instructions` block; the student fills the rest in the calculation field. Preserve the 10 + 10 point split. Embed the circuit figure in an `instructions` block using Markdown image syntax, `![...](/phy112/<filename>.png)`, per `FIGURES.md`.
>
> Keep the math algebra-based. House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done.

### Chunk 5: ex10 -> `magneticFluxInduction`

Source: `phy112_rec_ex10_soln.docx`. Topic: magnetic flux through a loop, flux when area or turns change, zero flux at 90 degrees, and induced-current direction by Lenz's law.

Simulation: use the Faraday lab the existing `phy132/magneticFieldFaraday.draft.lab.ts` embeds (read that file for the exact `url`; it is a hosted Faraday's Electromagnetic Lab build).

Section outline:

- Integrity `instructions`.
- Problem 1 `instructions` + figure: rectangular loop, area 0.500 m^2, B = 2.50 T into the page.
- `calculation` `prob1aFlux` (`equationEditor: true`): flux through the loop, 3 pts.
- `calculation` `prob1bFluxDoubledArea`: flux if loop area doubles (with the subtlety that the field region does not grow), 3 pts.
- `concept` or `calculation` `prob1cFlux20Turns`: flux linkage for 20 turns, 2 pts.
- Problem 2 `instructions` + figure: loop in the page plane, B in-plane.
- `concept` `prob2ZeroFlux`: explain why flux is zero, 3 pts.
- `instructions`: the four-step Lenz's-law explanation procedure (state B at t=0; how flux changes; apply Lenz's law for B_induced; right-hand rule for I_induced). JIT theory.
- Problem 3 `concept` blocks, one per case, each 3 pts: `prob3aIncreasing` (B out of page, increasing), `prob3bConstant` (constant), `prob3cDecreasing` (decreasing). Each asks for clockwise / counterclockwise / no current with full reasoning.
- Verification layer: `instructions` to open the Faraday sim and observe induced current as flux changes; `concept` `prob3Reconcile`: does the simulation behavior match the Lenz's-law predictions.

**Agent handoff prompt: Chunk 5**

> Create `src/content/labs/phy112/magneticFluxInduction.lab.ts` exporting `phy112MagneticFluxInductionLab: Lab` with `id: 'magneticFluxInduction'`. Student-facing conversion of recitation exercise 10 (source key `phy112_rec_ex10_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers).
>
> This is a Tier B lab: the source is a paper problem set; this conversion adds a Faraday induction simulation layer for qualitative verification of the Lenz's-law predictions. Read `docs/PHY112_TIER_AB_SPEC.md` Section 9 decision D2 and the Chunk 5 outline. Read `src/content/labs/phy132/magneticFieldFaraday.draft.lab.ts` to copy the exact Faraday simulation `url` and to see the `Lab` shape; read `src/content/labs/phy114/capacitors.draft.lab.ts` for the integrity/PDF blocks and house style; read `src/domain/schema/lab.ts` for the schema.
>
> Build Problems 1 to 3 per the outline: flux calculations as `calculation` blocks with `equationEditor: true`; the conceptual zero-flux and induced-current-direction questions as `concept` blocks. Reproduce the four-step Lenz's-law explanation procedure as a JIT `instructions` block immediately before Problem 3. Add the sim verification block after Problem 3. Preserve per-question points. Embed the loop/field figures in `instructions` blocks using Markdown image syntax, `![...](/phy112/<filename>.png)`, per `FIGURES.md`; flag answer-annotated figures with `TODO(human)`.
>
> Algebra-based. House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done.

### Chunk 6: ex11 -> `refractionAndTIR`

Source: `phy112_rec_ex11_soln.docx`. Topic: Snell's law refraction into a glass block (n = 1.35), critical angle, total internal reflection at the bottom face, exit angle.

Simulation: Bending Light. Use the entry from `src/content/labs/phy114/snellsLaw.lab.ts` (read it; that is a production lab and the strongest template for this one).

Section outline:

- Integrity `instructions`.
- `instructions` + figure: the glass block, beam entering at 30 degrees to the vertical surface; JIT Snell's law and critical-angle theory.
- `calculation` `partARefraction` (`equationEditor: true`): find the refraction angle theta_1, 5 pts.
- `calculation` `partBCriticalAngle`: critical angle for glass-air, 5 pts.
- `concept` `partCPathChoice`: at the bottom face, does light follow Path A, Path B, or both; explain via comparison to the critical angle, 5 pts.
- `calculation` `partDExitAngle`: the exit angle for the realized path, 5 pts.
- Verification layer: `instructions` to set up the Bending Light sim with n = 1.35 and a 30-degree incidence; `multiMeasurement` `[simRefractionAngle, simCriticalAngle]`; `concept` `simReconcile`: do measured angles and the observed total internal reflection match the calculations.

**Agent handoff prompt: Chunk 6**

> Create `src/content/labs/phy112/refractionAndTIR.lab.ts` exporting `phy112RefractionAndTirLab: Lab` with `id: 'refractionAndTIR'`. Student-facing conversion of recitation exercise 11 (source key `phy112_rec_ex11_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers).
>
> This is a Tier B lab: a paper problem set augmented with a Bending Light simulation verification layer. Read `docs/PHY112_TIER_AB_SPEC.md` Section 9 decision D2 and the Chunk 6 outline. Read `src/content/labs/phy114/snellsLaw.lab.ts` first; it is a production Snell's-law lab and your strongest template; copy its `bendingLight` simulation entry. Read `src/content/labs/phy114/capacitors.draft.lab.ts` for the integrity/PDF blocks and house style; read `src/domain/schema/lab.ts` for the schema.
>
> Build the four problem parts (refraction angle, critical angle, path choice at the bottom face, exit angle) as `calculation` blocks with `equationEditor: true`, except the qualitative path-choice question which is a `concept` block. Place Snell's-law and critical-angle theory as a JIT `instructions` block before the calculations. Add the Bending Light verification block at the end. Preserve the 5/5/5/5 point split. Embed the glass-block figure in an `instructions` block using Markdown image syntax, `![...](/phy112/<filename>.png)`, per `FIGURES.md`.
>
> Algebra-based. House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done.

### Chunk 7: ex12 -> `mirrors`

Source: `phy112_rec_ex12_soln.docx` (no embedded figures). Topic: concave-mirror image formation (real image, 2x magnification, 25.0 cm radius of curvature); a second problem with a virtual image and an unknown mirror type.

Simulation: Geometric Optics. Use the entry from `src/content/labs/phy114/geometricOptics.draft.lab.ts`.

Section outline:

- Integrity `instructions`.
- `instructions`: JIT theory, the mirror equation and magnification, sign conventions for q, m, f.
- Problem 1 `instructions`: concave mirror, R = 25.0 cm, real image twice object size.
- `concept` `prob1aImageDistanceSign`: sign of q, 1 pt.
- `concept` `prob1bUprightInverted`: upright or inverted and why, 2 pts.
- `calculation` `prob1cObjectDistance` (`equationEditor: true`): object distance, 3 pts.
- Problem 2 `instructions`: 8.00 cm object, virtual image 3.50 cm tall, 4.00 cm behind the mirror.
- `concept` `prob2aImageDistanceSign`, 1 pt.
- `concept` `prob2bUprightInverted`, 2 pts.
- `calculation` `prob2cMagnification`, 3 pts.
- `calculation` `prob2dObjectDistance`, 3 pts.
- `calculation` `prob2eFocalLengthRadius`, 3 pts.
- `concept` `prob2fMirrorType`: concave / convex / plane and why, 2 pts.
- Verification layer: `instructions` to model both cases in the Geometric Optics sim (mirror mode); `multiMeasurement` for the sim-read object/image distances; `concept` `simReconcile`.

**Agent handoff prompt: Chunk 7**

> Create `src/content/labs/phy112/mirrors.lab.ts` exporting `phy112MirrorsLab: Lab` with `id: 'mirrors'`. Student-facing conversion of recitation exercise 12 (source key `phy112_rec_ex12_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers). This recitation has no embedded figures.
>
> This is a Tier B lab: a paper problem set augmented with a Geometric Optics simulation verification layer. Read `docs/PHY112_TIER_AB_SPEC.md` Section 9 decision D2 and the Chunk 7 outline. Read `src/content/labs/phy114/geometricOptics.draft.lab.ts` for the Geometric Optics simulation entry and the `Lab` shape; read `src/content/labs/phy114/capacitors.draft.lab.ts` for the integrity/PDF blocks and house style; read `src/domain/schema/lab.ts` for the schema.
>
> Build the two problems per the outline. Sign-of-q and upright/inverted and mirror-type questions are `concept` blocks; numeric solves (object distance, magnification, focal length, radius) are `calculation` blocks with `equationEditor: true`. Put the mirror equation, magnification relation and sign conventions in a JIT `instructions` block before Problem 1. Add the Geometric Optics verification block at the end (use the sim's mirror mode). Preserve the per-question point values from the docx.
>
> Algebra-based. House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done.

### Chunk 8: ex13 -> `lenses`

Source: `phy112_rec_ex13_soln.docx` (no embedded figures). Topic: converging-lens image formation. Problem 1: f = 3.50 cm, image 5.00 cm from the lens, inverted. Problem 2: 5.00 mm insect, 10.0 cm from a converging lens of f = 12.0 cm.

Simulation: Geometric Optics (same entry as Chunk 7, lens mode).

Section outline:

- Integrity `instructions`.
- `instructions`: JIT theory, thin-lens equation and magnification, sign conventions, real vs virtual and front vs behind.
- Problem 1 `instructions`.
- `concept` `prob1aImageLocation`: image in front of or behind the lens and how you know, 3 pts.
- `calculation` `prob1bObjectDistance` (`equationEditor: true`), 3 pts.
- Problem 2 `instructions`.
- `calculation` `prob2aImagePosition`: position of the image, with interpretation, 4 pts.
- `calculation` `prob2bImageSize`: size via magnification, 4 pts.
- `concept` `prob2cUprightInverted`, 3 pts.
- `concept` `prob2dRealVirtual`, 3 pts.
- Verification layer: `instructions` to model both cases in the Geometric Optics sim (lens mode); `multiMeasurement` for sim-read image position and size; `concept` `simReconcile`.

**Agent handoff prompt: Chunk 8**

> Create `src/content/labs/phy112/lenses.lab.ts` exporting `phy112LensesLab: Lab` with `id: 'lenses'`. Student-facing conversion of recitation exercise 13 (source key `phy112_rec_ex13_soln.docx` in the connected PHY 112 folder; ANSWER KEY, strip all answers). This recitation has no embedded figures.
>
> This is a Tier B lab: a paper problem set augmented with a Geometric Optics simulation verification layer. Read `docs/PHY112_TIER_AB_SPEC.md` Section 9 decision D2 and the Chunk 8 outline. Read `src/content/labs/phy114/geometricOptics.draft.lab.ts` for the Geometric Optics simulation entry and the `Lab` shape; read `src/content/labs/phy114/capacitors.draft.lab.ts` for the integrity/PDF blocks and house style; read `src/domain/schema/lab.ts` for the schema.
>
> Build the two problems per the outline. Image-location, upright/inverted and real/virtual questions are `concept` blocks; numeric solves (object distance, image position, image size) are `calculation` blocks with `equationEditor: true`. Put the thin-lens equation, magnification relation and sign conventions in a JIT `instructions` block before Problem 1. Add the Geometric Optics verification block at the end (lens mode). Preserve the per-question point values from the docx.
>
> Algebra-based. House style: no em dashes; terse prompts; JIT theory before procedure; `---` before preambled prompts; unique camelCase field IDs. Touch only this new file. Run `npx tsc --noEmit` when done.

---

## 10. Chunk 9: Wire-up and verification

Runs after all 8 lab files exist and individually typecheck.

Tasks:

1. Add 8 prefixed re-exports to `src/content/labs/index.ts` (e.g. `export { phy112CapacitorsSeriesParallelLab } from './phy112/capacitorsSeriesParallel.lab';`).
2. In `src/content/courses/phy112.course.ts`, flip `enabled` to `true` for the 3 Tier A labs. Leave the 5 Tier B labs `enabled: false` pending Austin's sign-off on the simulation-verification layer (decision D2).
3. Run `npx tsc --noEmit` for a full-project typecheck.
4. Run the test suite and the linter (`npm run lint`).
5. Validate every lab object against `LabSchema` (the Zod schema) and every course against `CourseSchema`. There is likely a validation helper or an existing test pattern; reuse it.
6. Start the dev server and confirm all 8 labs render and the `phy112` course appears with correct lab numbering. Capture a screenshot of each lab's table of contents.

### Agent handoff prompt: Chunk 9

> All 8 PHY 112 lab files now exist under `src/content/labs/phy112/` and each typechecks on its own. Wire them into the LabFrame app and verify the whole course.
>
> 1. Edit `src/content/labs/index.ts`: add a prefixed re-export for each of the 8 labs, matching the existing `phy114` re-export style. The exports are `phy112CapacitorsSeriesParallelLab`, `phy112ResistorsSeriesParallelLab`, `phy112KirchhoffsRulesLab`, `phy112DcCircuitAnalysisLab`, `phy112MagneticFluxInductionLab`, `phy112RefractionAndTirLab`, `phy112MirrorsLab`, `phy112LensesLab`, from their respective `./phy112/*.lab` files.
> 2. Edit `src/content/courses/phy112.course.ts`: set `enabled: true` for the three Tier A labs (`capacitorsSeriesParallel`, `resistorsSeriesParallel`, `kirchhoffsRules`). Leave the five Tier B labs `enabled: false`; they are gated on a pedagogy review (see `docs/PHY112_TIER_AB_SPEC.md` decision D2).
> 3. Run `npx tsc --noEmit`, then `npm run lint`, then the test suite. Fix any wiring errors (not lab content).
> 4. Validate each lab against `LabSchema` and the course against `CourseSchema` from `@/domain/schema`, reusing whatever validation test pattern already exists in the repo.
> 5. Start the dev server, confirm the `phy112` course loads with all 8 labs at the correct lab numbers, and that each lab renders without console errors. Take a screenshot of each lab's table of contents.
>
> Report: typecheck/lint/test results, schema-validation results, and the screenshots. Do not change lab content; if a lab fails validation, report it for the owning chunk to fix rather than patching it here.

---

## 11. Open questions for Austin

1. **Tier B simulation layer (D2).** The 5 Tier B exercises are analytic problems. This spec adds a PhET predict-then-verify layer to each. Approve, or keep them calculation-only for strict parity with the paper recitations? Chunk 9 leaves Tier B disabled until this is settled.
2. **Answer-annotated figures.** The circuit and field diagrams are extracted from solution keys and likely carry answer markings (plate +/- labels, current arrows). Do you have clean, unannotated source figures, or should the original PHY 112 author be asked for blanks? Chunk 0 will produce a list of which figures are affected.
3. **`dataTable` with text columns.** The ex06 voltmeter-walk table mixes text and numeric columns. If the schema's `dataTable` only accepts numeric columns, the fallback is a `multiMeasurement` block or an HTML table skeleton. Confirm you are fine with the fallback, or whether a schema extension (a text column kind) is worth opening as a separate ticket.
4. **Recitation vs lab framing.** These are short in-class recitation exercises, not full lab-report labs. They will not carry the discussion-and-conclusion or rubric structure the migrated `phy114`/`phy132` labs have. Confirm that lighter structure is what you want for PHY 112, or whether recitations should be visually distinguished from labs in the course manifest.
5. **Figure embedding has no precedent.** No existing lab embeds an authored image, no `public/` directory exists, and `vite.config.ts` sets no `publicDir`. This spec assumes figures go in `public/phy112/` and are referenced with Markdown image syntax (`rehype-sanitize` should allow `img` with a relative `src`). Chunk 0 includes a smoke-test of that assumption. If you would rather figures be bundled assets imported from `src/`, or want a proper `image`-display section kind added to the schema (distinct from the upload-oriented `image` section), say so before Chunk 0 runs, because it changes the extraction target and possibly `MarkdownBlock.tsx`.
