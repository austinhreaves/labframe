export type LabIdentity = {
  courseId: string;
  labId: string;
  studentName: string;
};

export type ParsedImageKey = LabIdentity & {
  imageId: string;
};

const LAB_PREFIX = 'lab:';
const IMAGE_PREFIX = 'img:';
const REPORT_PREFIX = 'report:';

export function makeLabKey(identity: LabIdentity): string {
  return `${LAB_PREFIX}${identity.courseId}:${identity.labId}:${identity.studentName}`;
}

/**
 * Key for a persisted signed report. One key per lab + student, so a re-export
 * overwrites the previous report (keep-latest); both the metadata (localStorage)
 * and the sealed PDF blob (IndexedDB) are stored under this string.
 */
export function makeReportKey(identity: LabIdentity): string {
  return `${REPORT_PREFIX}${identity.courseId}:${identity.labId}:${identity.studentName}`;
}

export function reportPrefixForCourse(courseId: string): string {
  return `${REPORT_PREFIX}${courseId}:`;
}

export function parseReportKey(key: string): LabIdentity | null {
  if (!key.startsWith(REPORT_PREFIX)) {
    return null;
  }

  const [courseId, labId, ...nameParts] = key.slice(REPORT_PREFIX.length).split(':');
  if (!courseId || !labId || nameParts.length === 0) {
    return null;
  }

  return {
    courseId,
    labId,
    studentName: nameParts.join(':'),
  };
}

export function makeImageKey(identity: LabIdentity, imageId: string): string {
  return `${IMAGE_PREFIX}${identity.courseId}:${identity.labId}:${identity.studentName}:${imageId}`;
}

export function labPrefixForCourse(courseId: string): string {
  return `${LAB_PREFIX}${courseId}:`;
}

export function imagePrefixForCourse(courseId: string): string {
  return `${IMAGE_PREFIX}${courseId}:`;
}

export function parseLabKey(key: string): LabIdentity | null {
  if (!key.startsWith(LAB_PREFIX)) {
    return null;
  }

  const [courseId, labId, ...nameParts] = key.slice(LAB_PREFIX.length).split(':');
  if (!courseId || !labId || nameParts.length === 0) {
    return null;
  }

  return {
    courseId,
    labId,
    studentName: nameParts.join(':'),
  };
}

export function parseImageKey(key: string): ParsedImageKey | null {
  if (!key.startsWith(IMAGE_PREFIX)) {
    return null;
  }

  const [courseId, labId, studentName, ...imageParts] = key.slice(IMAGE_PREFIX.length).split(':');
  if (!courseId || !labId || !studentName || imageParts.length === 0) {
    return null;
  }

  return {
    courseId,
    labId,
    studentName,
    imageId: imageParts.join(':'),
  };
}
