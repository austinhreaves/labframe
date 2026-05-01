import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlotSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { PlotSectionView } from '@/ui/sections/PlotSectionView';

vi.mock('@/ui/primitives/Chart', () => ({
  Chart: () => <div data-testid="plot-chart" />,
}));

const baseSection: PlotSection = {
  kind: 'plot',
  plotId: 'plotA',
  sourceTableId: 'tableA',
  xCol: 'x',
  yCol: 'y',
  xLabel: 'X',
  yLabel: 'Y',
  fits: [{ id: 'linear', label: 'Linear (y = mx + b)' }],
};

describe('PlotSectionView', () => {
  beforeEach(() => {
    useLabStore.setState({
      tables: {},
      selectedFits: {},
    });
  });

  it('renders fit picker when fit options exist', () => {
    render(<PlotSectionView section={baseSection} />);
    expect(screen.getByLabelText('Fit model:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'No fit' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Linear (y = mx + b)' })).toBeInTheDocument();
  });

  it('does not render fit picker when fits are undefined or empty', () => {
    const noFitsSection: PlotSection = { ...baseSection, plotId: 'plotB', fits: undefined };
    const emptyFitsSection: PlotSection = { ...baseSection, plotId: 'plotC', fits: [] };

    const first = render(<PlotSectionView section={noFitsSection} />);
    expect(screen.queryByLabelText('Fit model:')).toBeNull();
    first.unmount();

    render(<PlotSectionView section={emptyFitsSection} />);
    expect(screen.queryByLabelText('Fit model:')).toBeNull();
  });

  it('updates selected fit in store on picker change', () => {
    render(<PlotSectionView section={baseSection} />);
    const picker = screen.getByLabelText('Fit model:');

    fireEvent.change(picker, { target: { value: 'linear' } });
    expect(useLabStore.getState().selectedFits.plotA).toBe('linear');

    fireEvent.change(picker, { target: { value: '' } });
    expect(useLabStore.getState().selectedFits.plotA).toBeNull();
  });
});
