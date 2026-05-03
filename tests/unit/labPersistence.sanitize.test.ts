import { describe, expect, it } from 'vitest';

import { migratePersistedLabState } from '@/state/persistence/labPersistenceMiddleware';

describe('migratePersistedLabState fit sanitization', () => {
  it('keeps only valid fit objects during hydrate', () => {
    const migrated = migratePersistedLabState(
      {
        schemaVersion: 2,
        courseId: 'phy132',
        labId: 'snellsLaw',
        studentName: 'Student',
        fields: {},
        tables: {},
        selectedFits: {},
        fits: {
          goodPlot: { model: 'linear', parameters: { a: 1, b: 2 } },
          badPlot: null,
          alsoBad: 'string',
          missingModel: { parameters: { a: 1 } },
        },
        images: {},
        splitFraction: 0.6,
        status: {
          submitted: false,
          lastSavedAt: 0,
        },
      },
      'lab:phy132:snellsLaw:Student',
    );

    expect(migrated).not.toBeNull();
    expect(migrated?.fits).toEqual({
      goodPlot: { model: 'linear', parameters: { a: 1, b: 2 } },
    });
  });
});
