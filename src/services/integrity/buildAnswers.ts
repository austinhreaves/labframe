import type { Course, LabAnswers } from '@/domain/schema';
import { resolveIntegrityAgreementText } from '@/services/integrity/agreementText';
import type { LabStoreState } from '@/state/labStore';

export function buildAnswersFromStore(course: Course, store: LabStoreState): LabAnswers {
  const agreementText = store.lab ? resolveIntegrityAgreementText(store.lab) : '';
  return {
    schemaVersion: 4,
    meta: {
      studentName: store.studentName || 'Student',
      semester: 'Fall',
      session: 'C',
      year: String(new Date().getFullYear()),
      taName: course.title,
    },
    integrity: {
      signedAs: store.studentName || 'Student',
      aiUsed: store.aiUsed,
      ...(store.aiUsed && store.aiSharedLinks.trim()
        ? { aiSharedLinks: store.aiSharedLinks.trim() }
        : {}),
      agreementAccepted: store.integrityAgreementAccepted,
      agreementAcceptedAt: store.integrityAgreementAcceptedAt,
      agreementText,
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
          ...(image.sha256 ? { sha256: image.sha256 } : {}),
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
      submitted: store.status.submitted,
      lastSavedAt: store.status.lastSavedAt,
    },
  };
}
