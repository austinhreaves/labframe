# Agent Handoff: Logarithmic Axis Support for Plot Sections

## Context

You are working on `labframe`, a TypeScript + React + Vite app that renders physics lab worksheets from declarative `Lab` schemas. The current `PlotSection` renders all axes on linear scales. Several upcoming AC-circuits lab content files need log-x or log-log axes to display frequency-response data spanning four decades cleanly.

This handoff is to add optional logarithmic-axis support to plot sections.

## Required reading before you start

- `src/domain/schema/lab.ts` — current `PlotSectionSchema` definition.
- `src/content/labs/phy132/rcLowPassFilter.lab.ts` — primary use case. Comment in the `gainVsFrequencyPlot` section flags this need.
- `src/content/labs/phy132/rlHighPassFilter.lab.ts` and `src/content/labs/phy132/rlcBandpassFilter.lab.ts` — secondary use cases.
- `REORG_PROPOSAL.md` (repo root) — section "Schema gaps the new labs surfaced" item 3.

## Goal

Extend `PlotSectionSchema` so authors can optionally specify log-scale x-axis, log-scale y-axis, or both. Default behavior (linear-linear) is preserved for all existing plots.

## Acceptance criteria

1. Existing `PlotSection` definitions continue to validate and render unchanged (linear-linear).
2. Authors can opt into log scaling per-axis:
   ```ts
   {
     kind: 'plot',
     plotId: 'gainVsFrequencyPlot',
     sourceTableId: 'frequencySweepTable',
     xCol: 'frequency',
     yCol: 'gainMeasured',
     xLabel: 'f (Hz)',
     yLabel: '|H| = V_out / V_in',
     xScale: 'log',  // NEW — optional, defaults to 'linear'
     yScale: 'linear',  // NEW — optional, defaults to 'linear'
     points: 1,
   }
   ```
3. Renderer handles non-positive values gracefully on log axes:
   - Skip rendering data points with x ≤ 0 or y ≤ 0 (log-undefined) and emit a console warning per skipped point.
   - Continue rendering valid points normally.
4. Tick marks on log axes use major ticks at decades (10⁰, 10¹, 10², ...) with minor ticks at the standard 2, 3, 4, 5, 6, 7, 8, 9 multiples.
5. Tick labels on log axes use scientific notation or "10ⁿ" format — pick one and document.

## Implementation steps

1. Update `src/domain/schema/lab.ts`:
   - Add `AxisScaleSchema = z.enum(['linear', 'log'])`.
   - Add optional `xScale` and `yScale` fields to `PlotSectionSchema`, defaulting to `'linear'`.
   - Export the `AxisScale` type via `z.infer`.
2. Update the plot renderer (find via `grep -r "PlotSection" src/ui/`) to:
   - Read `xScale`/`yScale` from the section, defaulting to `'linear'`.
   - Configure the underlying chart library accordingly. (Find the chart library import in the renderer file.)
   - Filter out non-positive values when log scale is selected, with a console.warn per skip.
3. Add unit tests in `tests/unit/`:
   - Schema parse test for `xScale: 'log'` and `yScale: 'log'`.
   - Schema parse test that `xScale: 'invalid'` rejects.
   - Default-value test confirming missing fields default to `'linear'`.
4. Update `rcLowPassFilter.lab.ts`, `rlHighPassFilter.lab.ts`, `rlcBandpassFilter.lab.ts` to use `xScale: 'log'` on their gain-vs-frequency plots. Verify rendering.
5. Update the comment in each of those files to remove the TODO referring to this handoff.

## Out of scope (do NOT do these)

- Symmetric-log (symlog) or arbitrary-power scales. Linear and log only.
- Axis range overrides (auto-scale only).
- Per-series scale (would conflict with multi-series handoff if both ship).

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass.
- The three filter labs render with log-x axes.
- No other lab content file needs to change.
- The change is backward compatible.
