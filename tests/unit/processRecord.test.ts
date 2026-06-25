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
  it('renders one dense activity row plus totals for an active section', () => {
    const answers = makeAnswers({
      fields: {
        calcField: makeFieldValue({
          text: 'x^2 + 1',
          pastes: [{ text: 'x^2', at: 1000, offset: 0, source: 'clipboard' }],
          meta: { activeMs: 125_000, keystrokes: 14, deletes: 2 },
        }),
      },
    });
    const calcLab: Lab = {
      ...snellsLawLab,
      sections: [
        {
          kind: 'calculation',
          fieldId: 'calcField',
          prompt: 'Solve for n2',
          equationEditor: true,
          points: 1,
        },
      ],
    };

    const tree = LabReportDocument({
      lab: calcLab,
      answers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();
    const record = textDump.slice(textDump.indexOf('Process Record'));

    // Dense table header, not the old five-line-per-section blocks.
    expect(record).toContain('Pastes (clip / auto / IME)');
    expect(textDump).not.toContain('Active time (ms):');
    // Active time reads H/M/S; the row carries keystrokes, deletes, and pastes.
    expect(record).toContain('Calculation2m 05s142');
    expect(record).toContain('1 / 0 / 0');
    // The totals row mirrors the single active section.
    expect(record).toContain('Total2m 05s142');
  });

  it('collapses zero-activity field-owning sections and omits field-less ones', () => {
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
    const record = textDump.slice(textDump.indexOf('Process Record'));

    // Every section is blank here, so all field-owning sections collapse into a
    // single line and the totals are zero.
    expect(record).toContain('No recorded activity:');
    expect(record).toContain('Total0s000 / 0 / 0');
    // Field-owning titles are listed; field-less (instructions/plot) are absent.
    expect(record).toContain('Objective');
    expect(record).toContain('Data Table');
    expect(record).not.toContain('Instructions');
    // The old per-section format is gone.
    expect(record).not.toContain('Active time (ms):');
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
