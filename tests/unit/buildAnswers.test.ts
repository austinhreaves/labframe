import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import type { Course } from '@/domain/schema';
import { DEFAULT_INTEGRITY_AGREEMENT_TEXT } from '@/services/integrity/agreementText';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { canonicalize } from '@/services/integrity/canonicalize';
import { createLabStore } from '@/state/labStore';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';

const courseFixture: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [{ ref: 'snellsLaw', enabled: true }],
};

describe('buildAnswersFromStore', () => {
  it('includes selectedFits and canonicalizes keys deterministically', async () => {
    const store = createLabStore(createMemoryPersistenceAdapter());
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    store.getState().setSelectedFit('zzzPlot', 'linear');
    store.getState().setSelectedFit('aaaPlot', 'proportional');
    store.getState().setFitSelection('zzzPlot', { model: 'linear', parameters: { a: 2, b: 3 } });
    store.getState().setFitSelection('aaaPlot', { model: 'proportional', parameters: { a: 2 } });
    store.getState().setAiUsed(true);
    store.getState().setAiSharedLinks('https://chat.example/thread');

    const answers = buildAnswersFromStore(courseFixture, store.getState());
    expect(answers.schemaVersion).toBe(4);
    expect(answers.selectedFits).toEqual({
      zzzPlot: 'linear',
      aaaPlot: 'proportional',
    });
    expect(answers.fits).toEqual({
      zzzPlot: { model: 'linear', parameters: { a: 2, b: 3 } },
      aaaPlot: { model: 'proportional', parameters: { a: 2 } },
    });
    expect(answers.integrity.aiUsed).toBe(true);
    expect(answers.integrity.aiSharedLinks).toBe('https://chat.example/thread');
    expect(answers.integrity.agreementText).toBe(DEFAULT_INTEGRITY_AGREEMENT_TEXT);
    expect(answers.integrity.agreementAccepted).toBe(false);
    expect(answers.integrity.agreementAcceptedAt).toBe(0);

    const canonical = canonicalize(answers);
    expect(canonical).toContain('"selectedFits":{"aaaPlot":"proportional","zzzPlot":"linear"}');
    expect(canonical).toContain(
      '"fits":{"aaaPlot":{"model":"proportional","parameters":{"a":2}},"zzzPlot":{"model":"linear","parameters":{"a":2,"b":3}}}',
    );
  });

  it('records agreement acceptance and timestamp when the student affirms', async () => {
    const store = createLabStore(createMemoryPersistenceAdapter());
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    const before = Date.now();
    store.getState().setIntegrityAgreementAccepted(true);
    const after = Date.now();

    const answers = buildAnswersFromStore(courseFixture, store.getState());
    expect(answers.integrity.agreementAccepted).toBe(true);
    expect(answers.integrity.agreementAcceptedAt).toBeGreaterThanOrEqual(before);
    expect(answers.integrity.agreementAcceptedAt).toBeLessThanOrEqual(after);
    expect(answers.integrity.agreementText).toBe(DEFAULT_INTEGRITY_AGREEMENT_TEXT);
  });

  it('resets agreement acceptance when unchecked', async () => {
    const store = createLabStore(createMemoryPersistenceAdapter());
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    store.getState().setIntegrityAgreementAccepted(true);
    store.getState().setIntegrityAgreementAccepted(false);

    const answers = buildAnswersFromStore(courseFixture, store.getState());
    expect(answers.integrity.agreementAccepted).toBe(false);
    expect(answers.integrity.agreementAcceptedAt).toBe(0);
  });

  it('filters null fit entries and does not throw', async () => {
    const store = createLabStore(createMemoryPersistenceAdapter());
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);
    store.getState().setFitSelection('goodPlot', { model: 'linear', parameters: { a: 2, b: 3 } });

    store.setState((state) => ({
      fits: {
        ...state.fits,
        nullPlot: null as unknown as { model: string; parameters: Record<string, number> },
      },
    }));

    expect(() => buildAnswersFromStore(courseFixture, store.getState())).not.toThrow();
    const answers = buildAnswersFromStore(courseFixture, store.getState());
    expect(answers.fits).toEqual({
      goodPlot: { model: 'linear', parameters: { a: 2, b: 3 } },
    });
  });
});
