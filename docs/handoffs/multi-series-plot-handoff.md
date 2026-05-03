# Agent Handoff: Multi-Series Plot Support

## Context

You are working on `labframe`, a TypeScript + React + Vite app that renders physics lab worksheets from declarative `Lab` schemas. The repo has a working `PlotSection` schema that supports a single `(xCol, yCol)` series per plot. Several upcoming lab content files need to overlay 2+ data series on the same axes — they currently use multiple side-by-side plots as a workaround.

This handoff is to extend the schema and renderer to support multi-series plots natively.

## Required reading before you start

- `src/domain/schema/lab.ts` — current `PlotSectionSchema` definition (look for `plot` discriminator in `SectionSchema`).
- `src/content/labs/phy132/theveninsTheorem.lab.ts` — workaround example. Two adjacent `plot` sections (`vLoadVsRLoadPlot` and `vLoadVsRLoadThPlot`) overlay V_L from the original network and Thevenin equivalent. Should become one plot with two series.
- `REORG_PROPOSAL.md` (repo root) — section "Schema gaps the new labs surfaced" item 1.

## Goal

Extend `PlotSectionSchema` so a single plot can render multiple Y-series sourced from the same `dataTable`, while preserving backward compatibility with all existing single-series plot sections.

## Acceptance criteria

1. Existing `PlotSection` definitions continue to validate against the schema and render unchanged.
2. A new optional shape lets the author specify multiple Y-series:
   ```ts
   {
     kind: 'plot',
     plotId: 'vLoadOverlayPlot',
     sourceTableId: 'verificationTable',
     xCol: 'rLoad',
     xLabel: 'R_L (Ω)',
     yLabel: 'V_L (V)',
     series: [
       { yCol: 'vL_orig', label: 'Original network', color: '#1f77b4' },
       { yCol: 'vL_th', label: 'Thevenin equivalent', color: '#ff7f0e' },
     ],
     points: 1,
   }
   ```
3. The existing `yCol` field is preserved as syntactic sugar for `series: [{ yCol: <value>, label: <yLabel> }]`. Authors can use either form.
4. Renderer displays a legend when `series.length > 1`.
5. Each series gets a distinct color from a default palette if `color` is not specified.
6. Fits (per the existing `fits` array) apply to all series independently. Each series gets its own fit overlay. (Out of scope if this is too much — defer to a follow-up.)

## Implementation steps

1. Update `src/domain/schema/lab.ts`:
   - Add a `PlotSeriesSchema = z.object({ yCol: idSchema, label: nonEmptyText.optional(), color: z.string().optional() })`.
   - Make `PlotSectionSchema.series` an optional `z.array(PlotSeriesSchema).min(1).optional()`.
   - Add a refinement that requires exactly one of `yCol` or `series` (not both).
   - Export the new `PlotSeries` type via `z.infer`.
2. Update the plot renderer (find via `grep -r "PlotSection" src/ui/`) to:
   - Normalize both shapes into an internal `series[]` representation at the top of the component.
   - Render multiple series via the existing chart library.
   - Render a legend when `series.length > 1`.
   - Use a default 6-color palette (use viridis or tab10 — pick one and document it).
3. Update unit tests in `tests/unit/` (look for any `plot` schema tests).
4. Add a new unit test asserting both single-series (legacy) and multi-series shapes parse successfully.
5. Update `theveninsTheorem.lab.ts` to use the multi-series form (collapsing `vLoadVsRLoadPlot` and `vLoadVsRLoadThPlot` into one). Verify the lab still validates and renders.

## Out of scope (do NOT do these)

- Per-series axis configuration (e.g., dual y-axes). Single shared y-axis only.
- Adding new plot types (scatter, bar, etc.). Line/scatter behavior should match existing.
- Performance optimization for large series counts. Assume ≤ 4 series.

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass.
- `theveninsTheorem.lab.ts` renders one combined plot with legend instead of two adjacent plots.
- The change is backward compatible: no other lab content file needs to change.
