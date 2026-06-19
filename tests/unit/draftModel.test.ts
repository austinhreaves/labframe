import { describe, expect, it } from 'vitest';

import type { LabDocSection } from '@/domain/schema';
import { loadUntrustedLabDoc } from '@/services/authoring';
import {
  createNewDraft,
  draftToLabDoc,
  labDocToDraft,
  newSection,
  type Draft,
} from '@/ui/author/draftModel';

const asJson = (value: unknown): string => JSON.stringify(value);

const SELF_CONTAINED_KINDS: LabDocSection['kind'][] = [
  'instructions',
  'objective',
  'measurement',
  'multiMeasurement',
  'dataTable',
  'image',
  'calculation',
  'concept',
];

function buildValidDraft(): Draft {
  const table = newSection('dataTable');
  let tableId = '';
  let columnId = '';
  if (table.section.kind === 'dataTable') {
    tableId = table.section.tableId;
    columnId = table.section.columns[0]?.id ?? '';
  }
  const plot = newSection('plot');
  if (plot.section.kind === 'plot') {
    plot.section = { ...plot.section, sourceTableId: tableId, xCol: columnId, yCol: columnId };
  }
  const draft = createNewDraft();
  return {
    ...draft,
    title: 'My Lab',
    author: 'Dr. A',
    sections: [...draft.sections, newSection('measurement'), table, plot],
  };
}

describe('draftModel', () => {
  it.each(SELF_CONTAINED_KINDS)('produces a schema-valid LabDoc for a %s section', async (kind) => {
    const base = createNewDraft();
    const draft: Draft = {
      ...base,
      title: 'T',
      author: 'A',
      sections: [newSection(kind)],
    };
    const result = await loadUntrustedLabDoc(asJson(draftToLabDoc(draft)));
    expect(result.ok).toBe(true);
  });

  it('builds a wired plot + table doc that passes the loader', async () => {
    const result = await loadUntrustedLabDoc(asJson(draftToLabDoc(buildValidDraft())));
    expect(result.ok).toBe(true);
  });

  it('round-trips through labDocToDraft without losing structure', async () => {
    const doc1 = draftToLabDoc(buildValidDraft());
    const doc2 = draftToLabDoc(labDocToDraft(doc1));

    expect(doc2.meta.title).toBe('My Lab');
    expect(doc2.meta.author).toBe('Dr. A');
    expect(doc2.meta.createdAt).toBe(doc1.meta.createdAt);
    expect(doc2.sections.map((s) => s.kind)).toEqual(doc1.sections.map((s) => s.kind));
    expect((await loadUntrustedLabDoc(asJson(doc2))).ok).toBe(true);
  });

  it('generates unique ids and editor keys', () => {
    const a = newSection('measurement');
    const b = newSection('measurement');
    expect(a.key).not.toBe(b.key);
    if (a.section.kind === 'measurement' && b.section.kind === 'measurement') {
      expect(a.section.fieldId).not.toBe(b.section.fieldId);
    }
  });

  it('omits the integrity block when no custom text is set', () => {
    const doc = draftToLabDoc(buildValidDraft());
    expect(doc.integrityAgreement).toBeUndefined();
  });
});
