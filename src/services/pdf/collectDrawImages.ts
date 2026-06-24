import { drawStorageKey, resolveResponseMode, type ResponseMode } from '@/domain/calculationResponse';
import type { BlobRef, FieldValue, Lab } from '@/domain/schema';
import { parseDrawing, rasterizeDrawingToDataUrl } from '@/ui/primitives/drawStrokes';

/**
 * Rasterized free-draw answers for the exported PDF. `dataUrls` are PNG data
 * URLs embedded in the document body (keyed by the draw storage key); `blobRefs`
 * carry the PNG byte count and SHA-256 so the drawing is bound into the signed
 * canonical envelope alongside uploaded images (Phase C-B).
 */
export type DrawArtifacts = {
  dataUrls: Record<string, string>;
  blobRefs: Record<string, BlobRef>;
};

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Hash is best-effort: environments without crypto.subtle still embed the PNG.
    return undefined;
  }
}

/**
 * Walk the lab for calculations whose effective mode is `draw`, rasterize each
 * stored drawing to PNG, and return the data URLs plus byte/hash references.
 * Only the active mode is rasterized, so a drawing the student entered but did
 * not select is left in storage and not embedded. Sections with no strokes are
 * skipped (they render as "No drawing attached").
 */
export async function collectDrawArtifacts(
  lab: Lab,
  fields: Record<string, FieldValue>,
  responseSelections: Record<string, ResponseMode> = {},
): Promise<DrawArtifacts> {
  const dataUrls: Record<string, string> = {};
  const blobRefs: Record<string, BlobRef> = {};

  for (const section of lab.sections) {
    if (section.kind !== 'calculation') {
      continue;
    }
    if (resolveResponseMode(section, responseSelections) !== 'draw') {
      continue;
    }
    const key = drawStorageKey(section.fieldId);
    const doc = parseDrawing(fields[key]?.text);
    const dataUrl = rasterizeDrawingToDataUrl(doc);
    if (!dataUrl) {
      continue;
    }
    const bytes = dataUrlToBytes(dataUrl);
    const sha256 = await sha256Hex(bytes);
    dataUrls[key] = dataUrl;
    blobRefs[key] = {
      idbKey: key,
      mime: 'image/png',
      bytes: bytes.byteLength,
      ...(sha256 ? { sha256 } : {}),
    };
  }

  return { dataUrls, blobRefs };
}
