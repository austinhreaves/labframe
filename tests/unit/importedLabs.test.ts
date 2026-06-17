import { describe, expect, it } from 'vitest';

import { hashLabDoc, loadUntrustedLabDoc } from '@/services/authoring';
import {
  deleteImportedLab,
  listImportedLabs,
  loadImportedLabText,
  saveImportedLab,
} from '@/state/importedLabs';
import { createMemoryPersistenceAdapter } from '@/state/persistence';

import { validLabDoc } from './fixtures/labDoc.fixtures';

describe('importedLabs storage', () => {
  it('saves, lists, and round-trips a doc back through the loader', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const doc = validLabDoc();
    const labHash = await hashLabDoc(doc);

    await saveImportedLab(doc, labHash, adapter);

    const list = await listImportedLabs(adapter);
    expect(list).toHaveLength(1);
    expect(list[0]?.labHash).toBe(labHash);
    expect(list[0]?.title).toBe('Custom Pendulum Lab');
    expect(list[0]?.author).toBe('Dr. Author');

    const text = await loadImportedLabText(labHash, adapter);
    expect(text).not.toBeNull();
    if (text) {
      const reloaded = await loadUntrustedLabDoc(text);
      expect(reloaded.ok).toBe(true);
      if (reloaded.ok) {
        expect(reloaded.labHash).toBe(labHash);
      }
    }
  });

  it('upserts rather than duplicating on re-import of the same hash', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const doc = validLabDoc();
    const labHash = await hashLabDoc(doc);
    await saveImportedLab(doc, labHash, adapter);
    await saveImportedLab(doc, labHash, adapter);
    expect(await listImportedLabs(adapter)).toHaveLength(1);
  });

  it('deletes the doc and clears answers when asked', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const doc = validLabDoc();
    const labHash = await hashLabDoc(doc);
    await saveImportedLab(doc, labHash, adapter);
    await adapter.saveJSON(`lab:imported:${labHash}:Student`, { answers: true });
    await adapter.saveBlob(`img:imported:${labHash}:Student:photo`, new Blob(['x']));

    await deleteImportedLab(labHash, { clearAnswers: true }, adapter);

    expect(await listImportedLabs(adapter)).toHaveLength(0);
    expect(await loadImportedLabText(labHash, adapter)).toBeNull();
    expect(await adapter.loadJSON(`lab:imported:${labHash}:Student`)).toBeNull();
    expect(await adapter.listKeys(`img:imported:${labHash}:`)).toHaveLength(0);
  });

  it('leaves answers in place when clearAnswers is not set', async () => {
    const adapter = createMemoryPersistenceAdapter();
    const doc = validLabDoc();
    const labHash = await hashLabDoc(doc);
    await saveImportedLab(doc, labHash, adapter);
    await adapter.saveJSON(`lab:imported:${labHash}:Student`, { answers: true });

    await deleteImportedLab(labHash, {}, adapter);

    expect(await adapter.loadJSON(`lab:imported:${labHash}:Student`)).not.toBeNull();
  });
});
