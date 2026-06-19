import type { Course, LabAnswers } from '@/domain/schema';
import { CAPTURE_DISCLOSURE_CORE } from '@/services/authoring/constants';
import { resolveIntegrityAgreementText } from '@/services/integrity/agreementText';
import type { LabStoreState } from '@/state/labStore';

/**
 * Envelope v5 derives the semester from the build/sign date rather than a
 * hardcoded value: Spring (Jan-Apr), Summer (May-Jul), Fall (Aug-Dec).
 */
function deriveSemester(date: Date): 'Spring' | 'Summer' | 'Fall' {
  const month = date.getMonth();
  if (month <= 3) {
    return 'Spring';
  }
  if (month <= 6) {
    return 'Summer';
  }
  return 'Fall';
}

export function buildAnswersFromStore(course: Course, store: LabStoreState): LabAnswers {
  const agreementText = store.lab ? resolveIntegrityAgreementText(store.lab) : '';
  const now = new Date();
  return {
    schemaVersion: 5,
    meta: {
      studentName: store.studentName || 'Student',
      semester: deriveSemester(now),
      year: String(now.getFullYear()),
      courseTitle: course.title,
    },
    // Imported (authored) labs bind their content hash; built-in labs omit it.
    ...(store.labHash ? { labHash: store.labHash } : {}),
    integrity: {
      signedAs: store.studentName || 'Student',
      aiUsed: store.aiUsed,
      ...(store.aiUsed && store.aiSharedLinks.trim()
        ? { aiSharedLinks: store.aiSharedLinks.trim() }
        : {}),
      agreementAccepted: store.integrityAgreementAccepted,
      agreementAcceptedAt: store.integrityAgreementAcceptedAt,
      agreementText,
      ...(store.labHash
        ? { captureDisclosureCorePresent: agreementText.includes(CAPTURE_DISCLOSURE_CORE) }
        : {}),
    },
    fields: store.fields,
    tables: store.tables,
    selectedFits: store.selectedFits,
    images: Object.fromEntries(
      Object.entries(store.images).map(([imageId, image]) => [
        imageId,
        {
          idbKey: image.idbKey,
          mime: image.mime,
          bytes: image.bytes,
        },
      ]),
    ),
    fits: Object.fromEntries(
      Object.entries(store.fits)
        .filter(([, fit]) => fit && typeof fit === 'object' && 'model' in fit)
        .map(([plotId, fit]) => [
          plotId,
          {
            model: fit.model,
            parameters: fit.parameters,
          },
        ]),
    ),
    status: {
      lastSavedAt: store.status.lastSavedAt,
    },
  };
}
