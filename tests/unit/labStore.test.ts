import { beforeEach, describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';

describe('labStore', () => {
  beforeEach(() => {
    useLabStore.getState().initLab('phy132', 'snellsLaw', snellsLawLab);
  });

  it('initializes table rows from schema', () => {
    const part1 = useLabStore.getState().tables.part1Table;
    expect(part1).toHaveLength(3);
  });

  it('recomputes derived values after input change', () => {
    const store = useLabStore.getState();
    store.setTableCell('part2Table', 0, 'incidentAngle', createEmptyFieldValue('30'));
    store.setTableCell('part2Table', 0, 'refractedAngle', createEmptyFieldValue('19.47122063449069'));

    const row = useLabStore.getState().tables.part2Table?.[0];
    expect(row).toBeDefined();
    if (!row) {
      throw new Error('Expected first row in part2Table');
    }
    expect(row.sinIncidentAngle).toBeDefined();
    expect(row.sinRefractedAngle).toBeDefined();
    if (!row.sinIncidentAngle || !row.sinRefractedAngle) {
      throw new Error('Expected derived cells in part2Table row');
    }
    expect(Number(row.sinIncidentAngle.text)).toBeCloseTo(0.5, 4);
    expect(Number(row.sinRefractedAngle.text)).toBeCloseTo(1 / 3, 4);
  });
});
