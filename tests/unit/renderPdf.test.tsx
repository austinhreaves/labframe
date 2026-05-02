import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { snellsLawLab } from '@/content/labs/snellsLaw.lab';
import type { Course, Lab, LabAnswers, TableData } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';
import { computeClippedFitLineInPdfSvg } from '@/services/pdf/fitLine';
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
  schemaVersion: 2,
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
  selectedFits: {},
  images: {},
  fits: {},
  status: {
    submitted: false,
    lastSavedAt: 0,
  },
};

describe('renderPDF', () => {
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

  it('keeps golden fit-line coordinates for proportional and linear fixtures', () => {
    const width = 360;
    const height = 220;
    const pad = 20;
    const table: TableData = [
      {
        x: { text: '1', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
        y: { text: '2', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
      },
      {
        x: { text: '2', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
        y: { text: '4', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
      },
      {
        x: { text: '3', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
        y: { text: '6', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
      },
    ];

    const points = table.map((row) => ({
      x: Number.parseFloat(row.x?.text ?? ''),
      y: Number.parseFloat(row.y?.text ?? ''),
    }));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const mapX = (x: number) => pad + ((x - minX) / rangeX) * (width - pad * 2);
    const mapY = (y: number) => height - pad - ((y - minY) / rangeY) * (height - pad * 2);

    const proportionalLine = computeClippedFitLineInPdfSvg({
      minX,
      maxX,
      a: 2,
      b: 0,
      mapX,
      mapY,
      plotBounds: { minX: pad, maxX: width - pad, minY: pad, maxY: height - pad },
    });
    const linearLine = computeClippedFitLineInPdfSvg({
      minX,
      maxX,
      a: 2,
      b: 3,
      mapX,
      mapY,
      plotBounds: { minX: pad, maxX: width - pad, minY: pad, maxY: height - pad },
    });

    expect(proportionalLine).toEqual({ x1: 20, y1: 200, x2: 340, y2: 20 });
    expect(linearLine).toEqual({ x1: 20, y1: 65, x2: 100, y2: 20 });
  });

  it('keeps markdown instruction structure in text-form snapshot', () => {
    const markdownLabFixture: Lab = {
      ...labFixture,
      sections: [
        {
          kind: 'instructions',
          html: ['## Part 1', '**Important:**', '- Item one', '- Item two', 'Inline math $\\sin\\theta_i$'].join('\n'),
        },
      ],
    };

    const tree = LabReportDocument({
      lab: markdownLabFixture,
      answers: answersFixture,
      course: courseFixture,
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();

    expect(textDump).toContain('Instructions');
    expect(textDump).toContain('Part 1');
    expect(textDump).toContain('• Item one');
    expect(textDump).toContain('• Item two');
    expect(textDump).toContain('sinθᵢ');
    expect(textDump).toMatchInlineSnapshot(
      `"Test LabTest CourseStudent: StudentSigned: 2024-04-30T04:06:40.000Z - 01234567InstructionsPart 1Important:• Item one• Item two Inline math sinθᵢProcess RecordSection 1: instructionsActive time (ms): 0Keystrokes: 0Pastes clipboard: 0Pastes autocomplete: 0Pastes IME: 0"`,
    );
  });

  it('includes Snell derived-column formula labels in table text snapshot', () => {
    const snellAnswers: LabAnswers = {
      ...answersFixture,
      tables: {
        part2Table: [
          {
            incidentAngle: { text: '10', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
            refractedAngle: { text: '7', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
            sinIncidentAngle: { text: '0.1736', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
            sinRefractedAngle: { text: '0.1219', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
          },
        ],
      },
    };

    const tree = LabReportDocument({
      lab: snellsLawLab,
      answers: snellAnswers,
      course: courseFixture,
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();
    const start = textDump.indexOf('Data Table: part2Table');
    const end = textDump.indexOf('Plot: part2FitPlot');

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const tableExcerpt = textDump.slice(start, end).trim();
    expect(tableExcerpt).toContain('sin(theta_i)');
    expect(tableExcerpt).toContain('sin(theta_r)');
    expect(tableExcerpt).toMatchInlineSnapshot(
      `"Data Table: part2TableIncident angle (deg)Refracted angle (deg)sin(theta_1)sin(theta_i)sin(theta_A)sin(theta_r)1070.17360.1219"`,
    );
  });
});
