import { describe, expect, it } from 'vitest';
import {
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
} from 'pdf-lib';
import type { PDFArray } from 'pdf-lib';

import { canonicalize } from '@/services/integrity/canonicalize';
import { sealPDF } from '@/services/pdf/seal';

// A hand-built minimal one-page PDF used as the seal input.
const MINIMAL_PDF = new Uint8Array([
  37, 80, 68, 70, 45, 49, 46, 55, 10, 37, 226, 227, 207, 211, 10, 49, 32, 48, 32, 111, 98, 106, 10,
  60, 60, 32, 47, 84, 121, 112, 101, 32, 47, 67, 97, 116, 97, 108, 111, 103, 32, 47, 80, 97, 103,
  101, 115, 32, 50, 32, 48, 32, 82, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 50, 32, 48, 32,
  111, 98, 106, 10, 60, 60, 32, 47, 84, 121, 112, 101, 32, 47, 80, 97, 103, 101, 115, 32, 47, 75,
  105, 100, 115, 32, 91, 51, 32, 48, 32, 82, 93, 32, 47, 67, 111, 117, 110, 116, 32, 49, 32, 62, 62,
  10, 101, 110, 100, 111, 98, 106, 10, 51, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 84, 121,
  112, 101, 32, 47, 80, 97, 103, 101, 32, 47, 80, 97, 114, 101, 110, 116, 32, 50, 32, 48, 32, 82,
  32, 47, 77, 101, 100, 105, 97, 66, 111, 120, 32, 91, 48, 32, 48, 32, 54, 49, 50, 32, 55, 57, 50,
  93, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 120, 114, 101, 102, 10, 48, 32, 52, 10, 48,
  48, 48, 48, 48, 48, 48, 48, 48, 48, 32, 54, 53, 53, 51, 53, 32, 102, 32, 10, 48, 48, 48, 48, 48,
  48, 48, 48, 49, 53, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 48, 54,
  52, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 49, 50, 49, 32, 48, 48,
  48, 48, 48, 32, 110, 32, 10, 116, 114, 97, 105, 108, 101, 114, 10, 60, 60, 32, 47, 82, 111, 111,
  116, 32, 49, 32, 48, 32, 82, 32, 47, 83, 105, 122, 101, 32, 52, 32, 62, 62, 10, 115, 116, 97, 114,
  116, 120, 114, 101, 102, 10, 49, 56, 56, 10, 37, 37, 69, 79, 70,
]);

const signature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const signedAt = 1714450000000;

async function extractAttachment(bytes: Uint8Array, filename: string): Promise<string | null> {
  const doc = await PDFDocument.load(bytes);
  type DictLike = { get: (name: PDFName) => unknown };
  type ContextLike = { lookup: (key: unknown) => unknown };
  const catalog = doc.catalog as unknown as DictLike;
  const context = doc.context as unknown as ContextLike;
  const dictGet = (dict: PDFDict, key: string): unknown =>
    (dict as unknown as DictLike).get(PDFName.of(key));

  const namesDict = context.lookup(catalog.get(PDFName.of('Names'))) as PDFDict | undefined;
  const embeddedFilesDict = namesDict
    ? (context.lookup(dictGet(namesDict, 'EmbeddedFiles')) as PDFDict | undefined)
    : undefined;
  const entriesArray = embeddedFilesDict
    ? (context.lookup(dictGet(embeddedFilesDict, 'Names')) as PDFArray | undefined)
    : undefined;
  if (!entriesArray) {
    return null;
  }

  for (let index = 0; index < entriesArray.size(); index += 2) {
    const filenameObject = context.lookup(entriesArray.get(index));
    const name = filenameObject instanceof PDFHexString ? filenameObject : undefined;
    if (!name || name.decodeText() !== filename) {
      continue;
    }
    const fileSpecObject = context.lookup(entriesArray.get(index + 1));
    const fileSpec = fileSpecObject instanceof PDFDict ? fileSpecObject : undefined;
    const embeddedObject = fileSpec ? context.lookup(dictGet(fileSpec, 'EF')) : undefined;
    const embedded = embeddedObject instanceof PDFDict ? embeddedObject : undefined;
    const streamObject = embedded ? context.lookup(dictGet(embedded, 'F')) : undefined;
    const stream = streamObject instanceof PDFRawStream ? streamObject : undefined;
    if (!(stream instanceof PDFRawStream)) {
      continue;
    }
    return new TextDecoder().decode(decodePDFRawStream(stream).decode());
  }
  return null;
}

describe('PDF seal roundtrip', () => {
  it('embeds lab.json and signature footer material', async () => {
    const canonical = canonicalize({
      schemaVersion: 5,
      fields: {
        objective: {
          text: 'hello',
          pastes: [],
          meta: { activeMs: 100, keystrokes: 2, deletes: 0 },
        },
      },
      integrity: {
        signedAs: 'Student',
        aiUsed: false,
        agreementAccepted: true,
        agreementAcceptedAt: 1714450000000,
        agreementText: 'I affirm.',
      },
      selectedFits: {},
      fits: {},
    });

    const bytes = await sealPDF(MINIMAL_PDF, {
      canonical,
      signature,
      signedAt,
      title: 'Test Report',
    });
    const sealedDoc = await PDFDocument.load(bytes);

    expect(sealedDoc.getTitle()).toBe('Test Report');
    expect(await extractAttachment(bytes, 'lab.json')).toBe(canonical);
    // Built-in (non-imported) labs carry no LabDoc attachment.
    expect(await extractAttachment(bytes, 'lab.labframe.json')).toBeNull();
  });

  it('embeds lab.labframe.json when a LabDoc is provided (imported lab)', async () => {
    const canonical = canonicalize({ schemaVersion: 5, labHash: 'abc123', fields: {} });
    const labDoc = canonicalize({ schemaVersion: 1, meta: { title: 'Custom Lab' } });

    const bytes = await sealPDF(MINIMAL_PDF, {
      canonical,
      signature,
      signedAt,
      title: 'Imported Report',
      labDoc,
    });

    expect(await extractAttachment(bytes, 'lab.json')).toBe(canonical);
    // The embedded LabDoc is the exact canonical bytes the labHash is taken over,
    // so a grader can re-hash it and compare against the signed labHash.
    expect(await extractAttachment(bytes, 'lab.labframe.json')).toBe(labDoc);
  });
});
