import { describe, expect, it } from 'vitest';
import { LabSchema } from '@/domain/schema';

/**
 * Negative-case coverage for the lab definition schema. The existing schema
 * tests are smoke tests that assert a real lab *passes*; these assert that
 * malformed labs are *rejected* at the expected path, so a regression that
 * loosens a constraint (e.g. dropping `.min(1)` on columns) gets caught.
 *
 * Mirrors the constraints in src/domain/schema/lab.ts.
 */

/** A minimal lab that satisfies every required field, used as the mutation base. */
function validLab(): Record<string, unknown> {
  return {
    id: 'test-lab',
    title: 'Test Lab',
    description: '',
    category: 'Mechanics',
    simulations: {},
    sections: [{ kind: 'instructions', html: '<p>intro</p>' }],
  };
}

/** Dotted paths of every issue in a failed parse, for path assertions. */
function failurePaths(lab: unknown): string[] {
  const result = LabSchema.safeParse(lab);
  expect(result.success).toBe(false);
  if (result.success) {
    return [];
  }
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('LabSchema rejects malformed labs', () => {
  it('accepts the minimal valid lab (mutation base is sound)', () => {
    expect(LabSchema.safeParse(validLab()).success).toBe(true);
  });

  it('rejects an empty id', () => {
    expect(failurePaths({ ...validLab(), id: '' })).toContain('id');
  });

  it('rejects a missing sections array', () => {
    const lab = validLab();
    delete lab.sections;
    expect(failurePaths(lab)).toContain('sections');
  });

  it('rejects an empty sections array', () => {
    expect(failurePaths({ ...validLab(), sections: [] })).toContain('sections');
  });

  it('rejects an unknown section kind (bad discriminant)', () => {
    const paths = failurePaths({ ...validLab(), sections: [{ kind: 'bogus' }] });
    expect(paths.some((p) => p.startsWith('sections'))).toBe(true);
  });

  it('rejects a dataTable with zero columns', () => {
    const lab = {
      ...validLab(),
      sections: [{ kind: 'dataTable', tableId: 't', columns: [], rowCount: 1 }],
    };
    expect(failurePaths(lab)).toContain('sections.0.columns');
  });

  it('rejects a dataTable with a non-positive rowCount', () => {
    const lab = {
      ...validLab(),
      sections: [
        {
          kind: 'dataTable',
          tableId: 't',
          columns: [{ id: 'c', label: 'C', kind: 'input' }],
          rowCount: 0,
        },
      ],
    };
    expect(failurePaths(lab)).toContain('sections.0.rowCount');
  });

  it('rejects negative section points', () => {
    const lab = {
      ...validLab(),
      sections: [{ kind: 'instructions', html: '<p>x</p>', points: -1 }],
    };
    expect(failurePaths(lab)).toContain('sections.0.points');
  });

  it('rejects a non-integer derived-column precision', () => {
    const lab = {
      ...validLab(),
      sections: [
        {
          kind: 'dataTable',
          tableId: 't',
          rowCount: 1,
          columns: [
            { id: 'c', label: 'C', kind: 'input' },
            {
              id: 'd',
              label: 'D',
              kind: 'derived',
              deps: ['c'],
              formula: () => 0,
              precision: 1.5,
            },
          ],
        },
      ],
    };
    expect(failurePaths(lab)).toContain('sections.0.columns.1.precision');
  });
});
