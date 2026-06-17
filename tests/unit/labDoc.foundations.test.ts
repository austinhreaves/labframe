import { describe, expect, it } from 'vitest';

import { LabDocSchema, LabSchema } from '@/domain/schema';
import {
  CAPTURE_DISCLOSURE_CORE,
  compileLabDoc,
  composeIntegrityAgreement,
  hashLabDoc,
} from '@/services/authoring';

import { validLabDoc } from './fixtures/labDoc.fixtures';

describe('LabDocSchema', () => {
  it('accepts a complete valid doc', () => {
    expect(LabDocSchema.safeParse(validLabDoc()).success).toBe(true);
  });

  it('rejects a data table with a derived column (none at MVP)', () => {
    const doc = validLabDoc();
    const table = doc.sections.find((section) => section.kind === 'dataTable');
    expect(table?.kind).toBe('dataTable');
    if (table?.kind === 'dataTable') {
      // @ts-expect-error derived columns are intentionally not representable in a LabDoc at MVP
      table.columns.push({ id: 'derived1', label: 'Derived', kind: 'derived' });
    }
    expect(LabDocSchema.safeParse(doc).success).toBe(false);
  });
});

describe('compileLabDoc', () => {
  it('produces a runtime Lab that validates against LabSchema', () => {
    const { lab } = compileLabDoc(validLabDoc());
    expect(() => LabSchema.parse(lab)).not.toThrow();
    expect(lab.title).toBe('Custom Pendulum Lab');
  });

  it('decodes assets into typed Blobs', () => {
    const { assets } = compileLabDoc(validLabDoc());
    expect(assets.fig1).toBeInstanceOf(Blob);
    expect(assets.fig1?.type).toBe('image/png');
  });

  it('inlines asset references in markdown as data URLs', () => {
    const { lab } = compileLabDoc(validLabDoc());
    const instructions = lab.sections.find((section) => section.kind === 'instructions');
    expect(instructions?.kind).toBe('instructions');
    if (instructions?.kind === 'instructions') {
      expect(instructions.html).toContain('data:image/png;base64,');
      expect(instructions.html).not.toContain('asset:fig1');
    }
  });
});

describe('composeIntegrityAgreement', () => {
  it('keeps the capture-disclosure core alongside custom text', () => {
    const text = composeIntegrityAgreement(
      validLabDoc({ integrityAgreement: { customText: 'Hello.' } }),
    );
    expect(text).toContain('Hello.');
    expect(text).toContain(CAPTURE_DISCLOSURE_CORE);
  });

  it('falls back to the core alone when no custom text is set', () => {
    const text = composeIntegrityAgreement(validLabDoc({ integrityAgreement: { customText: '' } }));
    expect(text).toBe(CAPTURE_DISCLOSURE_CORE);
  });
});

describe('hashLabDoc', () => {
  it('is a 64-hex digest, stable across calls', async () => {
    const first = await hashLabDoc(validLabDoc());
    const second = await hashLabDoc(validLabDoc());
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
  });

  it('changes when content changes', async () => {
    const original = validLabDoc();
    const edited = validLabDoc({ meta: { ...original.meta, title: 'A Different Title' } });
    expect(await hashLabDoc(original)).not.toBe(await hashLabDoc(edited));
  });
});
