import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PlotSection, TableData } from '@/domain/schema';
import { createEmptyFieldValue } from '@/state/labStore';
import { Chart } from '@/ui/primitives/Chart';

vi.mock('react-chartjs-2', () => ({
  Scatter: (props: { data: unknown; options: unknown }) => (
    <div data-testid="scatter" data-chart-data={JSON.stringify(props.data)} data-chart-options={JSON.stringify(props.options)} />
  ),
}));

function makeTable(rows: Array<{ x: number; y: number }>): TableData {
  return rows.map((row) => ({
    x: createEmptyFieldValue(String(row.x)),
    y: createEmptyFieldValue(String(row.y)),
  }));
}

describe('Chart', () => {
  it('renders scatter data and linear fit overlay', () => {
    const section: PlotSection = {
      kind: 'plot',
      plotId: 'testPlot',
      sourceTableId: 'tableA',
      xCol: 'x',
      yCol: 'y',
      xLabel: 'X axis',
      yLabel: 'Y axis',
      fits: [{ id: 'linear', label: 'Linear Fit' }],
    };
    const data = makeTable([
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ]);

    render(<Chart section={section} data={data} />);

    expect(screen.getByText(/X-axis: X axis/)).toBeInTheDocument();
    const scatter = screen.getByTestId('scatter');
    const chartData = JSON.parse(scatter.getAttribute('data-chart-data') ?? '{}');
    const chartOptions = JSON.parse(scatter.getAttribute('data-chart-options') ?? '{}');

    expect(chartData.datasets).toHaveLength(2);
    expect(chartData.datasets[0].data).toHaveLength(3);
    expect(chartOptions.scales.x.title.text).toBe('X axis');
    expect(chartOptions.scales.y.title.text).toBe('Y axis');

    const fitPoints = chartData.datasets[1].data as Array<{ x: number; y: number }>;
    expect(fitPoints).toHaveLength(2);
    const [first, second] = fitPoints;
    if (!first || !second) {
      throw new Error('Expected linear fit endpoints');
    }
    const slope = (second.y - first.y) / (second.x - first.x);
    const intercept = first.y - slope * first.x;
    expect(slope).toBeCloseTo(2, 9);
    expect(intercept).toBeCloseTo(1, 9);
  });

  it('warns for unsupported fits and remains mount-safe', () => {
    const section: PlotSection = {
      kind: 'plot',
      plotId: 'warnPlot',
      sourceTableId: 'tableA',
      xCol: 'x',
      yCol: 'y',
      xLabel: 'X',
      yLabel: 'Y',
      fits: [{ id: 'proportional', label: 'Proportional' }],
    };
    const data = makeTable([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const first = render(<Chart section={section} data={data} />);
    first.unmount();
    expect(() => render(<Chart section={section} data={data} />)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
