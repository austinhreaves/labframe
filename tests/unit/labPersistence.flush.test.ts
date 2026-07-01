import { create } from 'zustand';
import type { StoreApi } from 'zustand';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LabStoreState } from '@/state/labStore';
import { attachLabPersistence } from '@/state/persistence/labPersistenceMiddleware';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';
import type { PersistedLabState } from '@/state/persistence/types';

function makeMinimalStore(): StoreApi<LabStoreState> {
  const useStore = create(() => ({
    courseId: 'phy132',
    labId: 'snellsLaw',
    studentName: 'Student',
    aiUsed: false,
    aiSharedLinks: '',
    fields: {},
    tables: {},
    selectedFits: {},
    fits: {},
    responseSelections: {},
    images: {},
    splitFraction: 0.6,
    status: { submitted: false, lastSavedAt: 0, lastError: null },
  }));
  return useStore as unknown as StoreApi<LabStoreState>;
}

const serialize = (): PersistedLabState => ({ schemaVersion: 4 }) as unknown as PersistedLabState;

describe('attachLabPersistence flushPersistence', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists immediately and cancels the pending debounced write', () => {
    vi.useFakeTimers();
    const adapter = createMemoryPersistenceAdapter();
    const saveJSON = vi.spyOn(adapter, 'saveJSON').mockResolvedValue(undefined);
    const store = makeMinimalStore();
    const { flushPersistence, dispose } = attachLabPersistence(store, adapter, serialize);

    // A change schedules the 250 ms debounced write; nothing has been saved yet.
    store.setState({ studentName: 'Student 2' });
    expect(saveJSON).not.toHaveBeenCalled();

    // Flush writes synchronously, bypassing the debounce.
    flushPersistence();
    expect(saveJSON).toHaveBeenCalledTimes(1);

    // The pending debounce was cleared, so it never fires a second write.
    vi.advanceTimersByTime(500);
    expect(saveJSON).toHaveBeenCalledTimes(1);

    dispose();
  });
});
