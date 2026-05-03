import { beforeEach, describe, expect, it, vi } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { createEmptyFieldValue, createLabStore } from '@/state/labStore';
import { makeImageKey, makeLabKey } from '@/state/persistence/keys';
import { createMemoryPersistenceAdapter } from '@/state/persistence/memoryAdapter';

describe('persistence roundtrip', () => {
  beforeEach(() => {
    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => `blob:test-${Math.random()}`),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test-${Math.random()}`);
    }

    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    }
  });

  it('restores saved data after reloading a new store instance', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const firstStore = createLabStore(adapter);

    await firstStore.getState().initLab('phy132', 'snellsLaw', snellsLawLab);
    firstStore.getState().setField('objective', createEmptyFieldValue('verify persistence'));
    firstStore.getState().setTableCell('part1Table', 0, 'incidentAngle', createEmptyFieldValue('30'));
    firstStore.getState().setSelectedFit('part2FitPlot', 'proportional');
    firstStore.getState().setFitSelection('part2FitPlot', { model: 'proportional', parameters: { a: 1 } });
    firstStore.getState().setImage('part4Image', new File(['hello'], 'photo.png', { type: 'image/png' }));

    await new Promise((resolve) => setTimeout(resolve, 400));

    const secondStore = createLabStore(adapter);
    await secondStore.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    expect(secondStore.getState().fields.objective?.text).toBe('verify persistence');
    expect(secondStore.getState().tables.part1Table?.[0]?.incidentAngle?.text).toBe('30');
    expect(secondStore.getState().selectedFits.part2FitPlot).toBe('proportional');
    expect(secondStore.getState().fits.part2FitPlot).toEqual({ model: 'proportional', parameters: { a: 1 } });
    expect(secondStore.getState().images.part4Image?.fileName).toBe('photo.png');

    const blob = await adapter.loadBlob(
      makeImageKey({ courseId: 'phy132', labId: 'snellsLaw', studentName: secondStore.getState().studentName }, 'part4Image'),
    );
    expect(blob).not.toBeNull();

    const persisted = await adapter.loadJSON<{
      schemaVersion: number;
      selectedFits?: Record<string, string | null>;
      fits?: Record<string, unknown>;
    }>(makeLabKey({ courseId: 'phy132', labId: 'snellsLaw', studentName: secondStore.getState().studentName }));
    expect(persisted?.schemaVersion).toBe(3);
    expect(persisted?.selectedFits?.part2FitPlot).toBe('proportional');
    expect(persisted?.fits?.part2FitPlot).toEqual({ model: 'proportional', parameters: { a: 1 } });
  });

  it('hydrates v1 persisted state by defaulting selectedFits/fits and autosaves as v3', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const studentName = 'Student';
    const labKey = makeLabKey({ courseId: 'phy132', labId: 'snellsLaw', studentName });

    await adapter.saveJSON(labKey, {
      schemaVersion: 1,
      courseId: 'phy132',
      labId: 'snellsLaw',
      studentName,
      fields: {
        objective: createEmptyFieldValue('legacy v1'),
      },
      tables: {},
      images: {},
      splitFraction: 0.6,
      status: {
        submitted: false,
        lastSavedAt: 123,
      },
    });

    const store = createLabStore(adapter);
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    expect(store.getState().fields.objective?.text).toBe('legacy v1');
    expect(store.getState().selectedFits).toEqual({});
    expect(store.getState().fits).toEqual({});

    store.getState().setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const persisted = await adapter.loadJSON<{
      schemaVersion: number;
      selectedFits?: Record<string, string | null>;
      fits?: Record<string, unknown>;
      status?: { submitted?: boolean };
    }>(labKey);

    expect(persisted?.schemaVersion).toBe(3);
    expect(persisted?.selectedFits).toEqual({});
    expect(persisted?.fits).toEqual({});
    expect(persisted?.status?.submitted).toBe(true);
  });

  it('hydrates v2 persisted state by defaulting AI disclosure fields', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const studentName = 'Student';
    const labKey = makeLabKey({ courseId: 'phy132', labId: 'snellsLaw', studentName });

    await adapter.saveJSON(labKey, {
      schemaVersion: 2,
      courseId: 'phy132',
      labId: 'snellsLaw',
      studentName,
      fields: {},
      tables: {},
      selectedFits: {},
      fits: {},
      images: {},
      splitFraction: 0.6,
      status: {
        submitted: false,
        lastSavedAt: 123,
      },
    });

    const store = createLabStore(adapter);
    await store.getState().initLab('phy132', 'snellsLaw', snellsLawLab);

    expect(store.getState().aiUsed).toBe(false);
    expect(store.getState().aiSharedLinks).toBe('');
  });
});
