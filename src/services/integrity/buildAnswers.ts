import type { Course, LabAnswers } from '@/domain/schema';
import type { LabStoreState } from '@/state/labStore';

export function buildAnswersFromStore(course: Course, store: LabStoreState): LabAnswers {
  return {
    schemaVersion: 2,
    meta: {
      studentName: store.studentName || 'Student',
      semester: 'Fall',
      session: 'C',
      year: String(new Date().getFullYear()),
      taName: course.title,
    },
    integrity: {
      signedAs: store.studentName || 'Student',
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
      submitted: store.status.submitted,
      lastSavedAt: store.status.lastSavedAt,
    },
  };
}
