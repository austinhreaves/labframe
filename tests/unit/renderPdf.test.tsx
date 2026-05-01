import { describe, expect, it } from 'vitest';

import type { Course, Lab, LabAnswers } from '@/domain/schema';
import { renderPDF } from '@/services/pdf/render';

const courseFixture: Course = {
  id: 'course-1',
  title: 'Test Course',
  storagePrefix: 'test',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab-1', enabled: true }],
};

const labFixture: Lab = {
  id: 'lab-1',
  title: 'Test Lab',
  description: 'Test lab for renderPDF.',
  category: 'Physics',
  simulations: {},
  sections: [{ kind: 'instructions', html: 'Hello world' }],
};

const answersFixture: LabAnswers = {
  schemaVersion: 1,
  meta: {
    studentName: 'Student',
    semester: 'Fall',
    session: 'C',
    year: '2026',
    taName: 'TA',
  },
  integrity: {
    signedAs: 'Student',
  },
  fields: {},
  tables: {},
  images: {},
  fits: {},
  status: {
    submitted: false,
    lastSavedAt: 0,
  },
};

describe('renderPDF', () => {
  it('returns Uint8Array bytes in browser-compatible path', async () => {
    const bytes = await renderPDF({
      lab: labFixture,
      answers: answersFixture,
      course: courseFixture,
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
