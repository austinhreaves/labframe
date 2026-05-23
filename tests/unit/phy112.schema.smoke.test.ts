import { describe, expect, it } from 'vitest';

import { CourseSchema, LabSchema } from '@/domain/schema';
import {
  phy112CapacitorsSeriesParallelLab,
  phy112KirchhoffsRulesLab,
  phy112ResistorsSeriesParallelLab,
} from '@/content/labs';
import { phy112Course } from '@/content/courses';

describe('phy112 Tier A schema validation', () => {
  it('phy112Course validates against CourseSchema', () => {
    const parsed = CourseSchema.parse(phy112Course);
    expect(parsed.id).toBe('phy112');
    expect(parsed.labs).toHaveLength(8);
    const enabled = parsed.labs.filter((l) => l.enabled).map((l) => l.ref);
    expect(enabled).toEqual([
      'capacitorsSeriesParallel',
      'resistorsSeriesParallel',
      'kirchhoffsRules',
    ]);
  });

  it.each([
    ['capacitorsSeriesParallel', phy112CapacitorsSeriesParallelLab],
    ['resistorsSeriesParallel', phy112ResistorsSeriesParallelLab],
    ['kirchhoffsRules', phy112KirchhoffsRulesLab],
  ])('%s validates against LabSchema', (id, lab) => {
    const parsed = LabSchema.parse(lab);
    expect(parsed.id).toBe(id);
    expect(parsed.sections.length).toBeGreaterThan(0);
  });
});
