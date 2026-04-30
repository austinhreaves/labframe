import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName } from 'pdf-lib';

import { canonicalize } from '@/services/integrity/canonicalize';
import { sealPDF } from '@/services/pdf/seal';

describe('PDF seal roundtrip', () => {
  it('embeds lab.json and signature footer material', async () => {
    const canonical = canonicalize({
      schemaVersion: 1,
      fields: {
        objective: { text: 'hello', pastes: [], meta: { activeMs: 100, keystrokes: 2, deletes: 0 } },
      },
    });
    const signedAt = 1714450000000;
    const signature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const inputPdf = new Uint8Array([
      37, 80, 68, 70, 45, 49, 46, 55, 10, 37, 226, 227, 207, 211, 10, 49, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32,
      47, 84, 121, 112, 101, 32, 47, 67, 97, 116, 97, 108, 111, 103, 32, 47, 80, 97, 103, 101, 115, 32, 50, 32, 48, 32,
      82, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 50, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 84, 121,
      112, 101, 32, 47, 80, 97, 103, 101, 115, 32, 47, 75, 105, 100, 115, 32, 91, 51, 32, 48, 32, 82, 93, 32, 47, 67, 111,
      117, 110, 116, 32, 49, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 51, 32, 48, 32, 111, 98, 106, 10, 60, 60,
      32, 47, 84, 121, 112, 101, 32, 47, 80, 97, 103, 101, 32, 47, 80, 97, 114, 101, 110, 116, 32, 50, 32, 48, 32, 82,
      32, 47, 77, 101, 100, 105, 97, 66, 111, 120, 32, 91, 48, 32, 48, 32, 54, 49, 50, 32, 55, 57, 50, 93, 32, 62, 62, 10,
      101, 110, 100, 111, 98, 106, 10, 120, 114, 101, 102, 10, 48, 32, 52, 10, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 32,
      54, 53, 53, 51, 53, 32, 102, 32, 10, 48, 48, 48, 48, 48, 48, 48, 48, 49, 53, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10,
      48, 48, 48, 48, 48, 48, 48, 48, 54, 52, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 49, 50,
      49, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 116, 114, 97, 105, 108, 101, 114, 10, 60, 60, 32, 47, 82, 111, 111, 116,
      32, 49, 32, 48, 32, 82, 32, 47, 83, 105, 122, 101, 32, 52, 32, 62, 62, 10, 115, 116, 97, 114, 116, 120, 114, 101, 102,
      10, 49, 56, 56, 10, 37, 37, 69, 79, 70,
    ]);

    const bytes = await sealPDF(inputPdf, { canonical, signature, signedAt, title: 'Test Report' });
    const sealedDoc = await PDFDocument.load(bytes);
    const names = (sealedDoc.catalog as unknown as { get: (name: unknown) => unknown }).get(PDFName.of('Names'));

    expect(sealedDoc.getTitle()).toBe('Test Report');
    expect(names).toBeDefined();
  });
});
