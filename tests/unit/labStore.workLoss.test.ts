import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { createEmptyFieldValue, createLabStore } from '@/state/labStore';
import { makeLabKey } from '@/state/persistence/keys';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';
import type { PersistedLabState } from '@/state/persistence/types';

const COURSE = 'phy132';
const LAB = 'snellsLaw';

function v4Payload(
  studentName: string,
  overrides: Partial<PersistedLabState> = {},
): PersistedLabState {
  return {
    schemaVersion: 4,
    courseId: COURSE,
    labId: LAB,
    studentName,
    aiUsed: false,
    aiSharedLinks: '',
    fields: {},
    tables: {},
    selectedFits: {},
    fits: {},
    images: {},
    splitFraction: 0.6,
    status: {
      submitted: false,
      lastSavedAt: 1000,
    },
    ...overrides,
  };
}

describe('work-loss regressions', () => {
  it('rename migration does not clobber a named record with a workless placeholder record', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const namedKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Ada Lovelace' });
    const placeholderKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Student' });

    // The student's real work, saved under their name on a previous visit.
    await adapter.saveJSON(
      namedKey,
      v4Payload('Ada Lovelace', {
        fields: { objective: createEmptyFieldValue('real answer') },
      }),
    );
    // A workless artifact under the placeholder key: the debounced persist of
    // initLab's reset, fired while the on-load rename was still running. Its
    // lastSavedAt is NEWER than the real record, so a timestamp guard would
    // not catch it.
    await adapter.saveJSON(
      placeholderKey,
      v4Payload('Student', {
        fields: { objective: createEmptyFieldValue('') },
        status: { submitted: false, lastSavedAt: 2000 },
      }),
    );

    const store = createLabStore(adapter);
    await store.getState().initLab(COURSE, LAB, snellsLawLab);
    await store.getState().setStudentName('Ada Lovelace');

    expect(store.getState().fields.objective?.text).toBe('real answer');
    const persisted = await adapter.loadJSON<PersistedLabState>(namedKey);
    expect(persisted?.fields.objective).toMatchObject({ text: 'real answer' });
    // The artifact is cleaned up, not re-migrated on a later load.
    expect(await adapter.loadJSON(placeholderKey)).toBeNull();
  });

  it('rename migration still moves real placeholder work to the new name', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const placeholderKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Student' });

    await adapter.saveJSON(
      placeholderKey,
      v4Payload('Student', {
        fields: { objective: createEmptyFieldValue('typed before naming') },
      }),
    );

    const store = createLabStore(adapter);
    await store.getState().initLab(COURSE, LAB, snellsLawLab);
    await store.getState().setStudentName('Grace Hopper');

    const namedKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Grace Hopper' });
    const persisted = await adapter.loadJSON<PersistedLabState>(namedKey);
    expect(persisted?.fields.objective).toMatchObject({ text: 'typed before naming' });
    expect(persisted?.studentName).toBe('Grace Hopper');
    expect(await adapter.loadJSON(placeholderKey)).toBeNull();
  });

  it('hydrates text answers even when every image blob load rejects', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const brokenIdbAdapter = {
      ...adapter,
      loadBlob: async () => {
        throw new Error('InvalidStateError: database unavailable');
      },
    };
    const labKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Student' });

    await adapter.saveJSON(
      labKey,
      v4Payload('Student', {
        fields: { objective: createEmptyFieldValue('answers survive broken IndexedDB') },
        images: {
          part4Image: { idbKey: 'img:x', mime: 'image/png', bytes: 5, fileName: 'photo.png' },
        },
      }),
    );

    const store = createLabStore(brokenIdbAdapter);
    await expect(store.getState().initLab(COURSE, LAB, snellsLawLab)).resolves.toBeUndefined();
    expect(store.getState().fields.objective?.text).toBe('answers survive broken IndexedDB');
    expect(store.getState().images).toEqual({});
  });

  it('flushes pending edits for the outgoing lab when switching labs inside the debounce window', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const store = createLabStore(adapter);

    await store.getState().initLab(COURSE, LAB, snellsLawLab);
    store
      .getState()
      .setField('objective', createEmptyFieldValue('edited moments before switching'));

    // Switch labs immediately, well inside the 250 ms persist debounce.
    await store.getState().initLab(COURSE, 'otherLab', snellsLawLab);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const outgoingKey = makeLabKey({ courseId: COURSE, labId: LAB, studentName: 'Student' });
    const persisted = await adapter.loadJSON<PersistedLabState>(outgoingKey);
    expect(persisted?.fields.objective).toMatchObject({ text: 'edited moments before switching' });
  });
});
