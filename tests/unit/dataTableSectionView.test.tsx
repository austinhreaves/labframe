import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DataTableSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { DataTableSectionView } from '@/ui/sections/DataTableSectionView';

describe('DataTableSectionView', () => {
  beforeEach(() => {
    useLabStore.setState({ tables: {} });
  });

  it('renders derived formula labels with aria-label in header', () => {
    const section: DataTableSection = {
      kind: 'dataTable',
      tableId: 'tableA',
      rowCount: 1,
      columns: [
        { id: 'incidentAngle', label: 'Incident angle (deg)', kind: 'input', unit: 'deg' },
        {
          id: 'sinIncidentAngle',
          label: 'sin(theta_1)',
          kind: 'derived',
          formulaLabel: 'sin(theta_i)',
          deps: ['incidentAngle'],
          formula: () => 0,
          precision: 4,
        },
      ],
    };

    const { container } = render(<DataTableSectionView section={section} />);
    expect(screen.getByText('sin(theta_i)')).toBeInTheDocument();
    const formulaLabel = container.querySelector('small[aria-label="sin(theta_i), derived column"]');
    expect(formulaLabel).not.toBeNull();
  });
});
