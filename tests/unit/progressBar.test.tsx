import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { buildTocEntries } from '@/domain/tocEntries';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { ProgressBar } from '@/ui/ProgressBar';

function countExpectedTotal(): number {
  return buildTocEntries(snellsLawLab.sections).length;
}

describe('ProgressBar', () => {
  it('shows 1/N when one section has text', () => {
    useLabStore.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    const total = countExpectedTotal();
    const firstFieldSection = snellsLawLab.sections.find(
      (section) =>
        section.kind === 'objective' ||
        section.kind === 'measurement' ||
        section.kind === 'calculation' ||
        section.kind === 'concept',
    );
    if (!firstFieldSection) {
      throw new Error('Expected at least one field-backed section');
    }

    if (
      firstFieldSection.kind !== 'objective' &&
      firstFieldSection.kind !== 'measurement' &&
      firstFieldSection.kind !== 'calculation' &&
      firstFieldSection.kind !== 'concept'
    ) {
      throw new Error('Expected text-backed field section');
    }

    act(() => {
      useLabStore.getState().setField(firstFieldSection.fieldId, createEmptyFieldValue('filled'));
    });

    render(<ProgressBar sections={snellsLawLab.sections} />);

    expect(screen.getByText(`Progress: 1/${total}`)).toBeInTheDocument();
  });
});
