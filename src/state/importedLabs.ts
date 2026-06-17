import type { LabDoc } from '@/domain/schema';
import { browserPersistenceAdapter } from '@/state/persistence/browserAdapter';
import type { PersistenceAdapter } from '@/state/persistence/types';

// Local-only storage for client-imported labs (the assignment constructor read
// path). LabDoc bytes live in IndexedDB under `labdoc:<labHash>`; a small index
// lives in localStorage. Answers persist separately under the reserved
// `imported` course id (see docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md section 4).

/** Reserved course id under which imported-lab answers/images are keyed. */
export const IMPORTED_COURSE_ID = 'imported';

const INDEX_KEY = 'labframe:imported-labs';
const DOC_KEY_PREFIX = 'labdoc:';

export type ImportedLabEntry = {
  labHash: string;
  title: string;
  author: string;
  humanVersion?: string;
  importedAt: number;
};

function docKey(labHash: string): string {
  return `${DOC_KEY_PREFIX}${labHash}`;
}

function isEntry(value: unknown): value is ImportedLabEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.labHash === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.author === 'string' &&
    typeof entry.importedAt === 'number'
  );
}

async function readIndex(adapter: PersistenceAdapter): Promise<ImportedLabEntry[]> {
  const raw = await adapter.loadJSON<unknown>(INDEX_KEY);
  return Array.isArray(raw) ? raw.filter(isEntry) : [];
}

export async function listImportedLabs(
  adapter: PersistenceAdapter = browserPersistenceAdapter,
): Promise<ImportedLabEntry[]> {
  const entries = await readIndex(adapter);
  return entries.sort((left, right) => right.importedAt - left.importedAt);
}

export async function saveImportedLab(
  doc: LabDoc,
  labHash: string,
  adapter: PersistenceAdapter = browserPersistenceAdapter,
): Promise<void> {
  await adapter.saveBlob(
    docKey(labHash),
    new Blob([JSON.stringify(doc)], { type: 'application/json' }),
  );
  const entry: ImportedLabEntry = {
    labHash,
    title: doc.meta.title,
    author: doc.meta.author,
    importedAt: Date.now(),
    ...(doc.meta.humanVersion ? { humanVersion: doc.meta.humanVersion } : {}),
  };
  const existing = await readIndex(adapter);
  await adapter.saveJSON(INDEX_KEY, [
    entry,
    ...existing.filter((item) => item.labHash !== labHash),
  ]);
}

function blobToText(blob: Blob): Promise<string> {
  // FileReader works in both browsers and the jsdom test environment, where
  // Blob.arrayBuffer()/text() are not implemented.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the stored lab.'));
    reader.readAsText(blob);
  });
}

export async function loadImportedLabText(
  labHash: string,
  adapter: PersistenceAdapter = browserPersistenceAdapter,
): Promise<string | null> {
  const blob = await adapter.loadBlob(docKey(labHash));
  return blob ? blobToText(blob) : null;
}

export async function deleteImportedLab(
  labHash: string,
  options: { clearAnswers?: boolean } = {},
  adapter: PersistenceAdapter = browserPersistenceAdapter,
): Promise<void> {
  await adapter.deleteBlob(docKey(labHash));
  const remaining = (await readIndex(adapter)).filter((item) => item.labHash !== labHash);
  await adapter.saveJSON(INDEX_KEY, remaining);

  if (options.clearAnswers) {
    const [labKeys, imageKeys] = await Promise.all([
      adapter.listKeys(`lab:${IMPORTED_COURSE_ID}:${labHash}:`),
      adapter.listKeys(`img:${IMPORTED_COURSE_ID}:${labHash}:`),
    ]);
    await Promise.all([
      ...labKeys.map((key) => adapter.deleteJSON(key)),
      ...imageKeys.map((key) => adapter.deleteBlob(key)),
    ]);
  }
}
