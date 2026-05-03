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
  it('renders non-zero telemetry for equation sections', () => {
    const answers = makeAnswers({
      fields: {
        eqField: makeFieldValue({
          text: 'x^2 + 1',
          pastes: [{ text: 'x^2', at: 1000, offset: 0, source: 'clipboard' }],
          meta: { activeMs: 321, keystrokes: 14, deletes: 2 },
        }),
      },
    });
    const legacyEquationLab = {
      ...snellsLawLab,
      sections: [{ kind: 'equation', fieldId: 'eqField', prompt: 'Solve for n2', points: 1 }],
    } as unknown as Lab;

    const tree = LabReportDocument({
      lab: legacyEquationLab,
      answers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();

    expect(textDump).toContain('Section 1: equation');
    expect(textDump).toContain('Active time (ms): 321');
    expect(textDump).toContain('Keystrokes: 14');
    expect(textDump).toContain('Pastes clipboard: 1');
    expect(textDump).toContain('Pastes autocomplete: 0');
    expect(textDump).toContain('Pastes IME: 0');
  });

  it('renders process-record telemetry lines for every current section kind', () => {
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

    expect((textDump.match(/Active time \(ms\):/g) ?? []).length).toBe(snellsLawLab.sections.length);
    expect((textDump.match(/Keystrokes:/g) ?? []).length).toBe(snellsLawLab.sections.length);
    expect((textDump.match(/Pastes clipboard:/g) ?? []).length).toBe(snellsLawLab.sections.length);
    expect((textDump.match(/Pastes autocomplete:/g) ?? []).length).toBe(snellsLawLab.sections.length);
    expect((textDump.match(/Pastes IME:/g) ?? []).length).toBe(snellsLawLab.sections.length);
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
