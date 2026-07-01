import { labPrefixForCourse, parseLabKey } from '@/state/persistence/keys';
import { listLocalStorageKeys, loadJSONFromLocalStorage } from '@/state/persistence/local';
import type { PersistedLabState } from '@/state/persistence/types';

export type LabProgress = 'not_started' | 'in_progress' | 'completed';

/**
 * Read-only progress derivation for the start screen (no new data model):
 * a lab record saved under `lab:<courseId>:<labId>:<studentName>` counts as
 * 'completed' once `status.submitted` is true (set by the signed PDF export)
 * and 'in_progress' otherwise. Labs with no record are 'not_started' and are
 * simply absent from the returned map.
 */
export async function deriveCourseProgress(
  courseId: string,
  studentName: string,
): Promise<Record<string, LabProgress>> {
  const progress: Record<string, LabProgress> = {};
  const trimmed = studentName.trim();
  if (!trimmed) {
    return progress;
  }

  let keys: string[] = [];
  try {
    keys = await listLocalStorageKeys(labPrefixForCourse(courseId));
  } catch {
    return progress;
  }

  for (const key of keys) {
    const identity = parseLabKey(key);
    if (!identity || identity.studentName !== trimmed) {
      continue;
    }
    const state = await loadJSONFromLocalStorage<PersistedLabState>(key);
    if (!state) {
      continue;
    }
    progress[identity.labId] = state.status?.submitted ? 'completed' : 'in_progress';
  }

  return progress;
}
