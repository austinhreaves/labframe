import { beforeEach, describe, expect, it, vi } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { createEmptyFieldValue, createLabStore } from '@/state/labStore';
import { makeImageKey } from '@/state/persistence/keys';
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

    await firstStore.getState().initLab('general', 'snellsLaw', snellsLawLab);
    firstStore.getState().setField('objective', createEmptyFieldValue('verify persistence'));
    firstStore.getState().setTableCell('part1Table', 0, 'incidentAngle', createEmptyFieldValue('30'));
    firstStore.getState().setImage('part4Image', new File(['hello'], 'photo.png', { type: 'image/png' }));

    await new Promise((resolve) => setTimeout(resolve, 400));

    const secondStore = createLabStore(adapter);
    await secondStore.getState().initLab('general', 'snellsLaw', snellsLawLab);

    expect(secondStore.getState().fields.objective?.text).toBe('verify persistence');
    expect(secondStore.getState().tables.part1Table?.[0]?.incidentAngle?.text).toBe('30');
    expect(secondStore.getState().images.part4Image?.fileName).toBe('photo.png');

    const blob = await adapter.loadBlob(
      makeImageKey({ courseId: 'general', labId: 'snellsLaw', studentName: secondStore.getState().studentName }, 'part4Image'),
    );
    expect(blob).not.toBeNull();
  });
});
