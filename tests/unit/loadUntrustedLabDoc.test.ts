import { describe, expect, it } from 'vitest';

import { loadUntrustedLabDoc } from '@/services/authoring';

import { PNG_1x1_BASE64, pngBytesLength, validLabDoc } from './fixtures/labDoc.fixtures';

const asJson = (value: unknown): string => JSON.stringify(value);

describe('loadUntrustedLabDoc - happy path', () => {
  it('loads a valid doc and returns a 64-hex hash', async () => {
    const result = await loadUntrustedLabDoc(asJson(validLabDoc()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.labHash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.doc.meta.title).toBe('Custom Pendulum Lab');
    }
  });

  it('accepts a Uint8Array input', async () => {
    const bytes = new TextEncoder().encode(asJson(validLabDoc()));
    const result = await loadUntrustedLabDoc(bytes);
    expect(result.ok).toBe(true);
  });

  it('hashes identically to a re-import of the same file', async () => {
    const json = asJson(validLabDoc());
    const a = await loadUntrustedLabDoc(json);
    const b = await loadUntrustedLabDoc(json);
    expect(a.ok && b.ok && a.labHash === b.labHash).toBe(true);
  });
});

describe('loadUntrustedLabDoc - rejections', () => {
  it('rejects malformed JSON', async () => {
    expect((await loadUntrustedLabDoc('{ not json')).ok).toBe(false);
  });

  it('rejects a schema violation (missing meta.author)', async () => {
    const raw = JSON.parse(asJson(validLabDoc())) as { meta: Record<string, unknown> };
    delete raw.meta.author;
    expect((await loadUntrustedLabDoc(asJson(raw))).ok).toBe(false);
  });

  it('rejects unknown top-level keys (strict)', async () => {
    expect((await loadUntrustedLabDoc(asJson({ ...validLabDoc(), surprise: true }))).ok).toBe(
      false,
    );
  });

  it('rejects an off-allow-list simulation host', async () => {
    const doc = validLabDoc({
      simulations: { sim: { title: 'X', url: 'https://evil.example.com/sim.html' } },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects a non-https simulation URL', async () => {
    const doc = validLabDoc({
      simulations: { sim: { title: 'X', url: 'http://phet.colorado.edu/sim.html' } },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects an asset whose bytes do not match its declared size', async () => {
    const doc = validLabDoc({
      assets: {
        fig1: { mime: 'image/png', dataBase64: PNG_1x1_BASE64, bytes: pngBytesLength() + 1 },
      },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects an asset whose content does not match its declared mime', async () => {
    const hello = 'aGVsbG8='; // valid base64, not a PNG
    const doc = validLabDoc({
      assets: { fig1: { mime: 'image/png', dataBase64: hello, bytes: atob(hello).length } },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects invalid base64 in an asset', async () => {
    const doc = validLabDoc({
      assets: { fig1: { mime: 'image/png', dataBase64: '!!!notbase64!!!', bytes: 3 } },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects an asset over the per-figure size cap', async () => {
    // "AAAA" decodes to 3 zero bytes; 700000 groups => 2.1 MB decoded, over 2 MB.
    const groups = 700000;
    const doc = validLabDoc({
      assets: { fig1: { mime: 'image/png', dataBase64: 'AAAA'.repeat(groups), bytes: groups * 3 } },
    });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects a plot referencing an unknown table', async () => {
    const doc = validLabDoc();
    const plot = doc.sections.find((section) => section.kind === 'plot');
    if (plot?.kind === 'plot') plot.sourceTableId = 'doesNotExist';
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects a plot referencing an unknown column', async () => {
    const doc = validLabDoc();
    const plot = doc.sections.find((section) => section.kind === 'plot');
    if (plot?.kind === 'plot') plot.yCol = 'doesNotExist';
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects duplicate field ids', async () => {
    const doc = validLabDoc();
    doc.sections.push({ kind: 'concept', fieldId: 'objective', prompt: 'duplicate of objective' });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });

  it('rejects a dangling asset reference in markdown', async () => {
    const doc = validLabDoc();
    doc.sections.unshift({ kind: 'instructions', html: '![x](asset:missingFigure)' });
    expect((await loadUntrustedLabDoc(asJson(doc))).ok).toBe(false);
  });
});
