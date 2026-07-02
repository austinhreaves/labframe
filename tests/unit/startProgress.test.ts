import { beforeEach, describe, expect, it } from 'vitest';

import { deriveCourseProgress } from '@/ui/catalog/startProgress';

function seedRecord(key: string, submitted: boolean) {
  localStorage.setItem(
    key,
    JSON.stringify({ status: { submitted, lastSavedAt: 1_700_000_000_000 } }),
  );
}

describe('deriveCourseProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps submitted records to completed and unsubmitted to in_progress', async () => {
    seedRecord('lab:phy114:chargeBuildup:Ada Lovelace', true);
    seedRecord('lab:phy114:coulombsLaw:Ada Lovelace', false);

    const progress = await deriveCourseProgress('phy114', 'Ada Lovelace');

    expect(progress).toEqual({
      chargeBuildup: 'completed',
      coulombsLaw: 'in_progress',
    });
  });

  it('scopes to the given student and course', async () => {
    seedRecord('lab:phy114:chargeBuildup:Ada Lovelace', true);
    seedRecord('lab:phy114:ohmsLaw:Someone Else', true);
    seedRecord('lab:phy132:chargeBuildup:Ada Lovelace', true);

    const progress = await deriveCourseProgress('phy114', 'Ada Lovelace');

    expect(progress).toEqual({ chargeBuildup: 'completed' });
  });

  it('returns nothing for a blank student name', async () => {
    seedRecord('lab:phy114:chargeBuildup:Ada Lovelace', true);

    expect(await deriveCourseProgress('phy114', '')).toEqual({});
    expect(await deriveCourseProgress('phy114', '   ')).toEqual({});
  });

  it('skips malformed records instead of throwing', async () => {
    localStorage.setItem('lab:phy114:chargeBuildup:Ada Lovelace', '{not json');
    seedRecord('lab:phy114:coulombsLaw:Ada Lovelace', false);

    const progress = await deriveCourseProgress('phy114', 'Ada Lovelace');

    expect(progress).toEqual({ coulombsLaw: 'in_progress' });
  });
});
