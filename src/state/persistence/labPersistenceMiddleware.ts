import type { StoreApi } from 'zustand';

import { FitResultSchema } from '@/domain/schema/answers';
import type { FitResult } from '@/domain/schema/answers';
import { makeLabKey } from '@/state/persistence/keys';
import type { PersistedLabState, PersistenceAdapter } from '@/state/persistence/types';
import type { LabStoreState } from '@/state/labStore';

const PERSIST_DEBOUNCE_MS = 250;
export const CURRENT_PERSISTED_SCHEMA_VERSION = 2 as const;
const LEGACY_PERSISTED_SCHEMA_VERSION = 1 as const;

type PersistedSlices = Pick<
  LabStoreState,
  'courseId' | 'labId' | 'studentName' | 'fields' | 'tables' | 'selectedFits' | 'fits' | 'images' | 'splitFraction'
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
    selectedFits: state.selectedFits,
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
    next.selectedFits !== previous.selectedFits ||
    next.fits !== previous.fits ||
    next.images !== previous.images ||
    next.splitFraction !== previous.splitFraction ||
    next.submitted !== previous.submitted
  );
}

type HydratedPersistedLabState = Omit<PersistedLabState, 'schemaVersion' | 'selectedFits' | 'fits'> & {
  schemaVersion: typeof CURRENT_PERSISTED_SCHEMA_VERSION;
  selectedFits: Record<string, string | null>;
  fits: Record<string, FitResult>;
};

function sanitizeFits(raw: unknown): Record<string, FitResult> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const out: Record<string, FitResult> = {};
  for (const [plotId, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = FitResultSchema.safeParse(value);
    if (parsed.success) {
      out[plotId] = parsed.data;
    } else {
      console.warn(`[persistence] Dropping invalid fit "${plotId}" during hydrate`, parsed.error.issues);
    }
  }

  return out;
}

export function migratePersistedLabState(raw: unknown, keyForLogging: string): HydratedPersistedLabState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const persisted = raw as PersistedLabState;
  if (persisted.schemaVersion === LEGACY_PERSISTED_SCHEMA_VERSION) {
    return {
      ...persisted,
      schemaVersion: CURRENT_PERSISTED_SCHEMA_VERSION,
      selectedFits: persisted.selectedFits ?? {},
      fits: sanitizeFits(persisted.fits),
    };
  }

  if (persisted.schemaVersion === CURRENT_PERSISTED_SCHEMA_VERSION) {
    return {
      ...persisted,
      schemaVersion: CURRENT_PERSISTED_SCHEMA_VERSION,
      selectedFits: persisted.selectedFits ?? {},
      fits: sanitizeFits(persisted.fits),
    };
  }

  console.warn(
    `[persistence] Unsupported schemaVersion "${String((persisted as { schemaVersion?: unknown }).schemaVersion)}" for ${keyForLogging}; skipping hydrate.`,
  );
  return null;
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
