import { LabDocSchema, type LabDoc, type LabDocAssetMime } from '@/domain/schema/labDoc';

import { base64ToBytes } from './bytes';
import {
  MAX_ASSET_BYTES,
  MAX_ASSETS,
  MAX_DOC_BYTES,
  MAX_MARKDOWN_CHARS,
  MAX_SECTIONS,
  MAX_TOTAL_ASSET_BYTES,
  SIM_DOMAIN_ALLOWLIST,
} from './constants';
import { hashLabDoc } from './labHash';

export type LoadLabDocResult =
  | { ok: true; doc: LabDoc; labHash: string }
  | { ok: false; error: string };

type Check = { ok: true } | { ok: false; reason: string };

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function toText(input: ArrayBuffer | Uint8Array | string): { text: string; byteLength: number } {
  if (typeof input === 'string') {
    return { text: input, byteLength: new TextEncoder().encode(input).length };
  }
  const view = input instanceof Uint8Array ? input : new Uint8Array(input);
  return { text: new TextDecoder().decode(view), byteLength: view.byteLength };
}

function checkSimUrl(url: string): Check {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'not a valid URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'must use https' };
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = SIM_DOMAIN_ALLOWLIST.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
  return allowed ? { ok: true } : { ok: false, reason: `host "${host}" is not on the allow-list` };
}

function magicBytesMatch(bytes: Uint8Array, mime: LabDocAssetMime): boolean {
  if (mime === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  // image/webp: "RIFF" .... "WEBP"
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function checkCrossReferences(doc: LabDoc): Check {
  const fieldIds = new Set<string>();
  const tableIds = new Set<string>();
  const plotIds = new Set<string>();
  const imageIds = new Set<string>();
  const tableColumns = new Map<string, Set<string>>();
  const assetIds = new Set(Object.keys(doc.assets));

  function claim(set: Set<string>, id: string, kind: string): Check | null {
    if (set.has(id)) {
      return { ok: false, reason: `Duplicate ${kind} id "${id}".` };
    }
    set.add(id);
    return null;
  }

  for (const section of doc.sections) {
    if (
      section.kind === 'objective' ||
      section.kind === 'measurement' ||
      section.kind === 'calculation' ||
      section.kind === 'concept'
    ) {
      const dup = claim(fieldIds, section.fieldId, 'field');
      if (dup) return dup;
    } else if (section.kind === 'multiMeasurement') {
      for (const row of section.rows) {
        const dup = claim(fieldIds, row.id, 'field');
        if (dup) return dup;
      }
    } else if (section.kind === 'image') {
      const imageDup = claim(imageIds, section.imageId, 'image');
      if (imageDup) return imageDup;
      const captionDup = claim(fieldIds, section.captionFieldId, 'field');
      if (captionDup) return captionDup;
    } else if (section.kind === 'dataTable') {
      const tableDup = claim(tableIds, section.tableId, 'table');
      if (tableDup) return tableDup;
      const columns = new Set<string>();
      for (const column of section.columns) {
        if (columns.has(column.id)) {
          return {
            ok: false,
            reason: `Duplicate column id "${column.id}" in table "${section.tableId}".`,
          };
        }
        columns.add(column.id);
      }
      tableColumns.set(section.tableId, columns);
    } else if (section.kind === 'plot') {
      const dup = claim(plotIds, section.plotId, 'plot');
      if (dup) return dup;
    }
  }

  for (const section of doc.sections) {
    if (section.kind !== 'plot') continue;
    const columns = tableColumns.get(section.sourceTableId);
    if (!columns) {
      return {
        ok: false,
        reason: `Plot "${section.plotId}" references unknown table "${section.sourceTableId}".`,
      };
    }
    if (!columns.has(section.xCol)) {
      return {
        ok: false,
        reason: `Plot "${section.plotId}" x column "${section.xCol}" is not in table "${section.sourceTableId}".`,
      };
    }
    if (!columns.has(section.yCol)) {
      return {
        ok: false,
        reason: `Plot "${section.plotId}" y column "${section.yCol}" is not in table "${section.sourceTableId}".`,
      };
    }
  }

  const assetRefPattern = /asset:([A-Za-z0-9_-]+)/g;
  for (const section of doc.sections) {
    const markdown =
      section.kind === 'instructions'
        ? section.html
        : section.kind === 'concept'
          ? (section.preamble ?? '')
          : '';
    if (!markdown) continue;
    for (const match of markdown.matchAll(assetRefPattern)) {
      const ref = match[1];
      if (ref && !assetIds.has(ref)) {
        return { ok: false, reason: `Markdown references a missing figure "asset:${ref}".` };
      }
    }
  }

  return { ok: true };
}

/**
 * The single hardened entry point for an authored lab from an untrusted source
 * (a file the student imports, or a LabDoc embedded in a PDF). Mirrors the
 * untrusted-input discipline in docs/SPEC.md section 4.4. Returns the cleaned,
 * schema-validated doc and its content hash, or a student-readable error.
 */
export async function loadUntrustedLabDoc(
  input: ArrayBuffer | Uint8Array | string,
): Promise<LoadLabDocResult> {
  const { text, byteLength } = toText(input);
  if (byteLength > MAX_DOC_BYTES) {
    return fail(`Lab file is too large (${byteLength} bytes; limit ${MAX_DOC_BYTES}).`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('Lab file is not valid JSON.');
  }

  const parsed = LabDocSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.join('.') ?? '';
    return fail(
      `Lab file does not match the LabDoc format${where ? ` (at ${where})` : ''}: ${issue?.message ?? 'invalid'}.`,
    );
  }
  const doc = parsed.data;

  if (doc.sections.length > MAX_SECTIONS) {
    return fail(`Too many sections (${doc.sections.length}; limit ${MAX_SECTIONS}).`);
  }
  for (const section of doc.sections) {
    if (section.kind === 'instructions' && section.html.length > MAX_MARKDOWN_CHARS) {
      return fail(`An instructions block exceeds the ${MAX_MARKDOWN_CHARS}-character limit.`);
    }
    if (section.kind === 'concept' && (section.preamble?.length ?? 0) > MAX_MARKDOWN_CHARS) {
      return fail(`A concept preamble exceeds the ${MAX_MARKDOWN_CHARS}-character limit.`);
    }
  }

  for (const [simId, sim] of Object.entries(doc.simulations)) {
    const verdict = checkSimUrl(sim.url);
    if (!verdict.ok) {
      return fail(`Simulation "${simId}" URL is not allowed: ${verdict.reason}.`);
    }
  }

  const assetEntries = Object.entries(doc.assets);
  if (assetEntries.length > MAX_ASSETS) {
    return fail(`Too many figures (${assetEntries.length}; limit ${MAX_ASSETS}).`);
  }
  let totalAssetBytes = 0;
  for (const [assetId, asset] of assetEntries) {
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = base64ToBytes(asset.dataBase64);
    } catch {
      return fail(`Figure "${assetId}" is not valid base64.`);
    }
    if (bytes.length !== asset.bytes) {
      return fail(`Figure "${assetId}" byte count does not match its declared size.`);
    }
    if (bytes.length > MAX_ASSET_BYTES) {
      return fail(`Figure "${assetId}" is too large (limit ${MAX_ASSET_BYTES} bytes).`);
    }
    if (!magicBytesMatch(bytes, asset.mime)) {
      return fail(`Figure "${assetId}" content does not match its declared type (${asset.mime}).`);
    }
    totalAssetBytes += bytes.length;
    if (totalAssetBytes > MAX_TOTAL_ASSET_BYTES) {
      return fail(`Figures exceed the total size limit (${MAX_TOTAL_ASSET_BYTES} bytes).`);
    }
    // Decoder round-trip per ADR-0003 when the browser API is available; jsdom
    // and Node lack createImageBitmap, where the magic-byte sniff above is the
    // guard. EXIF stripping happens at the render consumer, not here.
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(new Blob([bytes], { type: asset.mime }));
        bitmap.close();
      } catch {
        return fail(`Figure "${assetId}" could not be decoded as an image.`);
      }
    }
  }

  const crossRef = checkCrossReferences(doc);
  if (!crossRef.ok) {
    return fail(crossRef.reason);
  }

  const labHash = await hashLabDoc(doc);
  return { ok: true, doc, labHash };
}
