import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Lab } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';

function labWithSections(sections: Lab['sections']): Lab {
  return {
    id: 'section-points-test',
    title: 'Section points test',
    description: '',
    category: 'Physics',
    simulations: {},
    sections,
  };
}

describe('SectionRenderer section points', () => {
  it('shows the points caption when points is defined', () => {
    const lab = labWithSections([{ kind: 'objective', fieldId: 'objectiveField', points: 3 }]);
    useLabStore.getState().initLab('phy132', lab.id, lab);
    const section = lab.sections[0];
    if (!section) {
      throw new Error('expected section');
    }

    render(<SectionRenderer section={section} />);

    expect(screen.getByText('(3 points)')).toBeInTheDocument();
  });

  it('omits the caption when points is undefined', () => {
    const lab = labWithSections([{ kind: 'objective', fieldId: 'objectiveBare' }]);
    useLabStore.getState().initLab('phy132', lab.id, lab);
    const section = lab.sections[0];
    if (!section) {
      throw new Error('expected section');
    }

    render(<SectionRenderer section={section} />);

    expect(screen.queryByText(/^\([\d.]+\s+points\)$/)).not.toBeInTheDocument();
  });
});
