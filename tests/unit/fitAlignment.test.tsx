import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlotSection, TableData } from '@/domain/schema';
import { linearLeastSquares, proportionalLeastSquares } from '@/services/math/leastSquares';
import { computeClippedFitLineInPdfSvg } from '@/services/pdf/fitLine';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { Chart } from '@/ui/primitives/Chart';

vi.mock('react-chartjs-2', () => ({
  Scatter: () => <div data-testid="scatter" />,
}));

function makeTable(rows: Array<{ x: number; y: number }>): TableData {
  return rows.map((row) => ({
    x: createEmptyFieldValue(String(row.x)),
    y: createEmptyFieldValue(String(row.y)),
  }));
}

function makeSection(plotId: string): PlotSection {
  return {
    kind: 'plot',
    plotId,
    sourceTableId: 'tableA',
    xCol: 'x',
    yCol: 'y',
    xLabel: 'X',
    yLabel: 'Y',
    fits: [
      { id: 'linear', label: 'Linear Fit' },
      { id: 'proportional', label: 'Proportional Fit' },
    ],
  };
}

describe('fit alignment', () => {
  beforeEach(() => {
    useLabStore.setState({ selectedFits: {}, fits: {} });
  });

  it('persists linear fit with intercept and aligns PDF line endpoints', async () => {
    const section = makeSection('linearPlot');
    const rows = [
      { x: 1, y: 5.05 },
      { x: 2, y: 6.97 },
      { x: 3, y: 9.1 },
      { x: 4, y: 10.98 },
      { x: 5, y: 12.94 },
    ];
    const points = rows.map((row) => ({ x: row.x, y: row.y }));
    const truth = linearLeastSquares(points);
    if (!truth || truth.intercept === undefined) {
      throw new Error('Expected linear least squares result with intercept');
    }

    useLabStore.setState({
      selectedFits: { [section.plotId]: 'linear' },
    });
    render(<Chart section={section} data={makeTable(rows)} />);

    await waitFor(() => {
      const stored = useLabStore.getState().fits[section.plotId];
      expect(stored).toBeDefined();
      expect(stored?.model).toBe('linear');
      expect(stored?.parameters.a).toBeCloseTo(truth.slope, 9);
      expect(stored?.parameters.b).toBeCloseTo(truth.intercept!, 9);
    });

    const width = 360;
    const height = 220;
    const pad = 20;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const ys = points.map((point) => point.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const mapX = (x: number) => pad + ((x - minX) / rangeX) * (width - pad * 2);
    const mapY = (y: number) => height - pad - ((y - minY) / rangeY) * (height - pad * 2);

    const line = computeClippedFitLineInPdfSvg({
      minX,
      maxX,
      a: truth.slope,
      b: truth.intercept,
      mapX,
      mapY,
      plotBounds: { minX: pad, maxX: width - pad, minY: pad, maxY: height - pad },
    });
    expect(line).not.toBeNull();
    if (!line) {
      throw new Error('Expected clipped line for linear fit');
    }

    const lineMinX = pad;
    const lineMaxX = width - pad;
    const lineMinY = pad;
    const lineMaxY = height - pad;
    expect(line.x1).toBeGreaterThanOrEqual(lineMinX);
    expect(line.x1).toBeLessThanOrEqual(lineMaxX);
    expect(line.x2).toBeGreaterThanOrEqual(lineMinX);
    expect(line.x2).toBeLessThanOrEqual(lineMaxX);
    expect(line.y1).toBeGreaterThanOrEqual(lineMinY);
    expect(line.y1).toBeLessThanOrEqual(lineMaxY);
    expect(line.y2).toBeGreaterThanOrEqual(lineMinY);
    expect(line.y2).toBeLessThanOrEqual(lineMaxY);
    expect(line.x2).toBeGreaterThan(line.x1);

    const unmapX = (px: number) => minX + ((px - pad) / (width - pad * 2)) * rangeX;
    const fitYAtLeft = truth.slope * unmapX(line.x1) + truth.intercept;
    const fitYAtRight = truth.slope * unmapX(line.x2) + truth.intercept;
    expect(line.y1).toBeCloseTo(mapY(fitYAtLeft), 6);
    expect(line.y2).toBeCloseTo(mapY(fitYAtRight), 6);
  });

  it('persists proportional fit and keeps intercept omitted while aligning endpoints', async () => {
    const section = makeSection('proportionalPlot');
    const rows = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
    ];
    const points = rows.map((row) => ({ x: row.x, y: row.y }));
    const truth = proportionalLeastSquares(points);
    if (!truth) {
      throw new Error('Expected proportional least squares result');
    }

    useLabStore.setState({
      selectedFits: { [section.plotId]: 'proportional' },
    });
    render(<Chart section={section} data={makeTable(rows)} />);

    await waitFor(() => {
      const stored = useLabStore.getState().fits[section.plotId];
      expect(stored).toBeDefined();
      expect(stored?.model).toBe('proportional');
      expect(stored?.parameters.a).toBeCloseTo(truth.slope, 9);
      expect(stored?.parameters.b).toBeUndefined();
    });

    const width = 360;
    const height = 220;
    const pad = 20;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const ys = points.map((point) => point.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const mapX = (x: number) => pad + ((x - minX) / rangeX) * (width - pad * 2);
    const mapY = (y: number) => height - pad - ((y - minY) / rangeY) * (height - pad * 2);

    const line = computeClippedFitLineInPdfSvg({
      minX,
      maxX,
      a: truth.slope,
      b: 0,
      mapX,
      mapY,
      plotBounds: { minX: pad, maxX: width - pad, minY: pad, maxY: height - pad },
    });
    expect(line).not.toBeNull();
    if (!line) {
      throw new Error('Expected clipped line for proportional fit');
    }

    expect(line.x1).toBeCloseTo(mapX(minX), 6);
    expect(line.x2).toBeCloseTo(mapX(maxX), 6);
    expect(line.y1).toBeCloseTo(mapY(truth.slope * minX), 6);
    expect(line.y2).toBeCloseTo(mapY(truth.slope * maxX), 6);
  });
});
