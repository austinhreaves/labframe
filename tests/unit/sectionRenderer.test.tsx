import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { useLabStore } from '@/state/labStore';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';

describe('SectionRenderer', () => {
  it('renders every section kind in Snell schema without crashing', () => {
    useLabStore.getState().initLab('general', 'snellsLaw', snellsLawLab);

    render(
      <div>
        {snellsLawLab.sections.map((section, index) => (
          <SectionRenderer key={`${section.kind}-${index}`} section={section} />
        ))}
      </div>,
    );

    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(screen.getByText(/Concept Check Questions/i)).toBeInTheDocument();
  });
});
