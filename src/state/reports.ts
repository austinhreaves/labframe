import {
  makeReportKey,
  parseReportKey,
  reportPrefixForCourse,
  type LabIdentity,
} from '@/state/persistence/keys';
import { loadBlobFromIdb, saveBlobToIdb } from '@/state/persistence/idb';
import {
  listLocalStorageKeys,
  loadJSONFromLocalStorage,
  saveJSONToLocalStorage,
} from '@/state/persistence/local';

/**
 * Metadata for a persisted signed report. Stored (as JSON in localStorage)
 * alongside the sealed PDF blob (in IndexedDB) under the same `report:...` key,
 * so the Completed section can list reports without loading every blob and
 * re-download the exact original on demand. Local-only, never transmitted.
 */
export type ReportMeta = LabIdentity & {
  /** Signing timestamp (ms), used as the completion date and sort key. */
  submittedAt: number;
  signature: string;
  /** The download filename produced at export time. */
  filename: string;
  bytes: number;
  /** The persistence key (also the IndexedDB blob key) for Open report. */
  key: string;
};

/**
 * Persist a signed report. Keeps only the latest per lab + student: the key is
 * stable, so a re-export overwrites both the metadata and the blob (no orphan
 * blobs). Storage failures (e.g. quota) are swallowed by the caller, since the
 * student already has the downloaded copy.
 */
export async function saveReport(meta: Omit<ReportMeta, 'key'>, blob: Blob): Promise<void> {
  const key = makeReportKey(meta);
  await saveBlobToIdb(key, blob);
  await saveJSONToLocalStorage(key, { ...meta, key });
}

/** All saved reports for a student in a course, newest first. */
export async function listCourseReports(
  courseId: string,
  studentName: string,
): Promise<ReportMeta[]> {
  const trimmed = studentName.trim();
  if (!trimmed) {
    return [];
  }

  let keys: string[] = [];
  try {
    keys = await listLocalStorageKeys(reportPrefixForCourse(courseId));
  } catch {
    return [];
  }

  const reports: ReportMeta[] = [];
  for (const key of keys) {
    const identity = parseReportKey(key);
    if (!identity || identity.studentName !== trimmed) {
      continue;
    }
    const meta = await loadJSONFromLocalStorage<ReportMeta>(key);
    if (meta) {
      reports.push({ ...meta, key });
    }
  }

  return reports.sort((a, b) => b.submittedAt - a.submittedAt);
}

/** Load the sealed PDF blob for a saved report, or null if it is gone. */
export async function loadReportBlob(key: string): Promise<Blob | null> {
  return loadBlobFromIdb(key);
}
