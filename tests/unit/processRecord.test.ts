import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { snellsLawLab } from '@/content/labs';
import type { Course, FieldValue, Lab, LabAnswers, Section } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';

function makeFieldValue(overrides?: Partial<FieldValue>): FieldValue {
  return {
    text: '',
    pastes: [],
    meta: {
      activeMs: 0,
      keystrokes: 0,
      deletes: 0,
      ...overrides?.meta,
    },
    ...overrides,
  };
}

const courseFixture: Course = {
  id: 'course-1',
  title: 'Test Course',
  storagePrefix: 'test',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab-1', enabled: true }],
};

function makeAnswers(overrides?: Partial<LabAnswers>): LabAnswers {
  return {
    schemaVersion: 4,
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
      agreementAccepted: true,
      agreementAcceptedAt: 1714450000000,
      agreementText: 'I affirm.',
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
    ...overrides,
  };
}

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

describe('process record appendix', () => {
  it('renders a dense row with a formatted duration for a section with activity', () => {
    const answers = makeAnswers({
      fields: {
        calcField: makeFieldValue({
          text: 'x^2 + 1',
          pastes: [{ text: 'x^2', at: 1000, offset: 0, source: 'clipboard' }],
          meta: { activeMs: 321_000, keystrokes: 14, deletes: 2 },
        }),
      },
    });
    const calcLab = {
      ...snellsLawLab,
      sections: [{ kind: 'calculation', fieldId: 'calcField', prompt: 'Solve for n2', points: 1 }],
    } as unknown as Lab;

    const tree = LabReportDocument({
      lab: calcLab,
      answers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();

    // Dense table header and a single active row (cells concatenate without
    // spaces in the text dump, so assert on each distinguishing token).
    expect(textDump).toContain('Active time');
    expect(textDump).toContain('Pastes (c / a / i)');
    expect(textDump).toContain('Calculation');
    // 321000ms -> "5m 21s", once in the row and once in the totals row.
    expect((textDump.match(/5m 21s/g) ?? []).length).toBe(2);
    // Paste breakdown clipboard / autocomplete / ime.
    expect(textDump).toContain('1 / 0 / 0');
  });

  it('collapses zero-activity field sections and omits instructions and plots', () => {
    const answers = makeAnswers();
    const tree = LabReportDocument({
      lab: snellsLawLab,
      answers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();
    const processRecord = textDump.slice(textDump.indexOf('Process Record'));

    // Nothing was answered, so the dense table is absent and every field-owning
    // section is listed under the single "No recorded activity" line.
    expect(processRecord).toContain('No recorded activity on any section.');
    expect(processRecord).toContain('No recorded activity:');
    expect(processRecord).toContain('Objective');
    expect(processRecord).toContain('Data Table');
    // Field-less sections never reach the Process Record: no instruction heading
    // (e.g. "Part 1") and no plot title (the "vs." separator) appears here.
    expect(processRecord).not.toContain('Part 1');
    expect(processRecord).not.toContain('vs.');
  });
});

function brokenSwitchMustBeExhaustive(section: Section): string {
  switch (section.kind) {
    case 'instructions':
    case 'objective':
    case 'measurement':
    case 'multiMeasurement':
    case 'dataTable':
    case 'plot':
    case 'calculation':
    case 'concept':
      return section.kind;
    default: {
      // @ts-expect-error Deliberately omit "image" so this assignment must fail.
      const _unhandled: never = section;
      return String(_unhandled);
    }
  }
}

void brokenSwitchMustBeExhaustive;
