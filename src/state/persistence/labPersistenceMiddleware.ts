import type { StoreApi } from 'zustand';

import { makeLabKey } from '@/state/persistence/keys';
import type { PersistedLabState, PersistenceAdapter } from '@/state/persistence/types';
import type { LabStoreState } from '@/state/labStore';

const PERSIST_DEBOUNCE_MS = 250;

type PersistedSlices = Pick<
  LabStoreState,
  'courseId' | 'labId' | 'studentName' | 'fields' | 'tables' | 'fits' | 'images' | 'splitFraction'
> & {
  submitted: boolean;
};

function selectPersistedSlices(state: LabStoreState): PersistedSlices {
  return {
    courseId: state.courseId,
    labId: state.labId,
    studentName: state.studentName,
    fields: state.fields,
    tables: state.tables,
    fits: state.fits,
    images: state.images,
    splitFraction: state.splitFraction,
    submitted: state.status.submitted,
  };
}

function hasPersistableChange(next: PersistedSlices, previous: PersistedSlices): boolean {
  return (
    next.courseId !== previous.courseId ||
    next.labId !== previous.labId ||
    next.studentName !== previous.studentName ||
    next.fields !== previous.fields ||
    next.tables !== previous.tables ||
    next.fits !== previous.fits ||
    next.images !== previous.images ||
    next.splitFraction !== previous.splitFraction ||
    next.submitted !== previous.submitted
  );
}

export function attachLabPersistence(
  store: StoreApi<LabStoreState>,
  adapter: PersistenceAdapter,
  serialize: (state: LabStoreState, savedAt: number) => PersistedLabState,
): () => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const persistNow = async () => {
    const state = store.getState();
    if (!state.courseId || !state.labId || !state.studentName) {
      return;
    }

    const savedAt = Date.now();
    const key = makeLabKey({
      courseId: state.courseId,
      labId: state.labId,
      studentName: state.studentName,
    });

    try {
      await adapter.saveJSON(key, serialize(state, savedAt));
      if (!disposed) {
        store.setState((current) => ({
          status: {
            ...current.status,
            lastSavedAt: savedAt,
            lastError: null,
          },
        }));
      }
    } catch (error) {
      if (!disposed) {
        store.setState((current) => ({
          status: {
            ...current.status,
            lastError: error instanceof Error ? error.message : 'Unable to save to local storage.',
          },
        }));
      }
    }
  };

  const unsubscribe = store.subscribe((nextState, prevState) => {
    const next = selectPersistedSlices(nextState);
    const previous = selectPersistedSlices(prevState);
    if (!hasPersistableChange(next, previous)) {
      return;
    }

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      void persistNow();
    }, PERSIST_DEBOUNCE_MS);
  });

  return () => {
    disposed = true;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    unsubscribe();
  };
}
