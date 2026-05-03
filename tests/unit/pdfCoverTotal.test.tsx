import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { sumSectionPoints } from '@/domain/pointsFormatting';
import type { Course, Lab, LabAnswers } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';

const courseFixture: Course = {
  id: 'course-cover',
  title: 'Cover Course',
  storagePrefix: 'test',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab-cover', enabled: true }],
};

const answersFixture: LabAnswers = {
  schemaVersion: 3,
  meta: {
    studentName: 'Student',
    semester: 'Fall',
    session: 'C',
    year: '2026',
    taName: 'TA',
  },
  integrity: {
    signedAs: 'Student',
    aiUsed: false,
  },
  fields: {},
  tables: {},
  selectedFits: {},
  images: {},
  fits: {},
  status: {
    submitted: false,
    lastSavedAt: 0,
  },
};

function collectText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((child) => collectText(child)).join('');
  }
  if (!isValidElement(node)) {
    return '';
  }
  return collectText((node as { props: { children?: unknown } }).props.children);
}

describe('PDF cover total points', () => {
  it('sums section points and renders Total on the cover page', () => {
    const lab: Lab = {
      id: 'lab-cover',
      title: 'Cover Lab',
      description: 'Test',
      category: 'Physics',
      simulations: {},
      sections: [
        { kind: 'instructions', html: 'A', points: 2 },
        { kind: 'instructions', html: 'B', points: 3 },
      ],
    };

    expect(sumSectionPoints(lab.sections)).toBe(5);

    const tree = LabReportDocument({
      lab,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();

    expect(textDump).toContain('Total: 5 points');
  });
});
