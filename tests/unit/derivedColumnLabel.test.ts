import { describe, expect, it } from 'vitest';

import { ColumnSchema } from '@/domain/schema';

describe('Derived column formulaLabel schema', () => {
  it('parses derived columns without formulaLabel', () => {
    const parsed = ColumnSchema.parse({
      id: 'sinIncidentAngle',
      label: 'sin(theta_1)',
      kind: 'derived',
      deps: ['incidentAngle'],
      formula: () => 0.5,
      precision: 4,
    });

    expect(parsed.kind).toBe('derived');
    if (parsed.kind !== 'derived') {
      throw new Error('Expected derived column');
    }
    expect(parsed.formulaLabel).toBeUndefined();
  });

  it('parses derived columns with formulaLabel', () => {
    const parsed = ColumnSchema.parse({
      id: 'sinIncidentAngle',
      label: 'sin(theta_1)',
      kind: 'derived',
      formulaLabel: 'sin(theta_i)',
      deps: ['incidentAngle'],
      formula: () => 0.5,
      precision: 4,
    });

    expect(parsed.kind).toBe('derived');
    if (parsed.kind !== 'derived') {
      throw new Error('Expected derived column');
    }
    expect(parsed.formulaLabel).toBe('sin(theta_i)');
  });
});
