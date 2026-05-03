import { describe, expect, it, vi } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { createLabStore, PROCESS_RECORD_EVENT_NAME } from '@/state/labStore';
import { makeLabKey } from '@/state/persistence/keys';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';
import type { PersistedLabState } from '@/state/persistence/types';

describe('labStore selectedFits', () => {
  it('setSelectedFit updates state, persists, and emits process-record event', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const store = createLabStore(adapter);
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    const listener = vi.fn();
    const handleEvent = (event: Event) => listener((event as CustomEvent).detail);
    window.addEventListener(PROCESS_RECORD_EVENT_NAME, handleEvent);

    store.getState().setSelectedFit('part2FitPlot', 'proportional');

    expect(store.getState().selectedFits.part2FitPlot).toBe('proportional');

    await new Promise((resolve) => setTimeout(resolve, 400));

    const persistedKey = makeLabKey({
      courseId: 'phy132',
      labId: 'snellsLaw',
      studentName: store.getState().studentName,
    });
    const persisted = await adapter.loadJSON<PersistedLabState>(persistedKey);
    expect(persisted?.selectedFits).toEqual({ part2FitPlot: 'proportional' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fit_selection',
        plotId: 'part2FitPlot',
        fitId: 'proportional',
        timestamp: expect.any(Number),
      }),
    );

    window.removeEventListener(PROCESS_RECORD_EVENT_NAME, handleEvent);
  });
});
