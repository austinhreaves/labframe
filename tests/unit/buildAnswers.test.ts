import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import type { Course } from '@/domain/schema';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { canonicalize } from '@/services/integrity/canonicalize';
import { createLabStore } from '@/state/labStore';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';

const courseFixture: Course = {
  id: 'general',
  title: 'General Physics',
  storagePrefix: 'general',
  parentOriginAllowList: [],
  labs: [{ ref: 'snellsLaw', enabled: true }],
};

describe('buildAnswersFromStore', () => {
  it('includes selectedFits and canonicalizes keys deterministically', async () => {
    const store = createLabStore(createMemoryPersistenceAdapter());
    await store.getState().initLab('general', 'snellsLaw', snellsLawLab);

    store.getState().setSelectedFit('zzzPlot', 'linear');
    store.getState().setSelectedFit('aaaPlot', 'proportional');
    store.getState().setFitSelection('zzzPlot', { model: 'linear', parameters: { a: 2, b: 3 } });
    store.getState().setFitSelection('aaaPlot', { model: 'proportional', parameters: { a: 2 } });

    const answers = buildAnswersFromStore(courseFixture, store.getState());
    expect(answers.schemaVersion).toBe(2);
    expect(answers.selectedFits).toEqual({
      zzzPlot: 'linear',
      aaaPlot: 'proportional',
    });
    expect(answers.fits).toEqual({
      zzzPlot: { model: 'linear', parameters: { a: 2, b: 3 } },
      aaaPlot: { model: 'proportional', parameters: { a: 2 } },
    });

    const canonical = canonicalize(answers);
    expect(canonical).toContain('"selectedFits":{"aaaPlot":"proportional","zzzPlot":"linear"}');
    expect(canonical).toContain(
      '"fits":{"aaaPlot":{"model":"proportional","parameters":{"a":2}},"zzzPlot":{"model":"linear","parameters":{"a":2,"b":3}}}',
    );
  });
});
