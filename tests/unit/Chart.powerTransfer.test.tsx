import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlotSection, TableData } from '@/domain/schema';
import { createEmptyFieldValue } from '@/state/labStore';
import { useLabStore } from '@/state/labStore';
import { Chart } from '@/ui/primitives/Chart';

vi.mock('react-chartjs-2', () => ({
  Scatter: (props: { data: unknown; options: unknown }) => (
    <div data-testid="scatter" data-chart-data={JSON.stringify(props.data)} />
  ),
}));

function makeTable(rows: Array<{ x: number; y: number }>): TableData {
  return rows.map((row) => ({
    x: createEmptyFieldValue(String(row.x)),
    y: createEmptyFieldValue(String(row.y)),
  }));
}

type ScatterPoint = { x: number; y: number };
type ChartDatasets = { datasets: Array<{ label?: string; data: ScatterPoint[] }> };

describe('Chart powerTransfer fit', () => {
  beforeEach(() => {
    useLabStore.setState({ selectedFits: {}, fits: {} });
  });

  it('samples the fitted curve densely and persists A/B parameters', () => {
    const section: PlotSection = {
      kind: 'plot',
      plotId: 'powerGraph',
      sourceTableId: 'powerTable',
      xCol: 'x',
      yCol: 'y',
      xLabel: 'R (Ω)',
      yLabel: 'P_R (W)',
      fits: [{ id: 'powerTransfer', label: 'Power transfer (P = A·R/(R + B)²)' }],
    };
    const rValues = [1, 2, 3, 5, 8, 12, 20];
    const data = makeTable(rValues.map((x) => ({ x, y: (36 * x) / ((x + 3) * (x + 3)) })));
    useLabStore.setState({ selectedFits: { [section.plotId]: 'powerTransfer' } });

    render(<Chart section={section} data={data} />);

    const chartData = JSON.parse(
      screen.getByTestId('scatter').getAttribute('data-chart-data') ?? '{}',
    ) as ChartDatasets;

    expect(chartData.datasets).toHaveLength(2);
    const fitDataset = chartData.datasets[1];
    if (!fitDataset) {
      throw new Error('Expected a fit dataset');
    }
    // Spec requires >= 50 samples for a nonlinear fit line.
    expect(fitDataset.data.length).toBe(101);
    const mid = fitDataset.data[50];
    if (!mid) {
      throw new Error('Expected a mid-curve sample');
    }
    expect(mid.y).toBeCloseTo((36 * mid.x) / ((mid.x + 3) * (mid.x + 3)), 6);

    expect(fitDataset.label).toContain('Power transfer');
    expect(fitDataset.label).toContain('A = ');
    expect(fitDataset.label).toContain('B = ');
    expect(fitDataset.label).toContain('(1σ)');
    expect(fitDataset.label).toContain('R^2 = ');

    const stored = useLabStore.getState().fits[section.plotId];
    expect(stored?.model).toBe('powerTransfer');
    expect(stored?.parameters.A).toBeCloseTo(36, 6);
    expect(stored?.parameters.B).toBeCloseTo(3, 6);
    expect(stored?.parameters.a).toBeUndefined();
    expect(stored?.parameters.b).toBeUndefined();
  });
});
