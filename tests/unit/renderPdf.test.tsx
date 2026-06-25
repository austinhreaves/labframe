import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { snellsLawLab } from '@/content/labs';
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
    agreementText:
      'I affirm this submission reflects my own work. If AI or LLM tools — chatbots, large language models, or generative AI assistants such as ChatGPT, Claude, Gemini, Copilot, or any similar tool — were used in any part of this lab, the chats are disclosed and share links are provided below (required by course policy).',
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

// 1x1 transparent PNG, the smallest valid raster for exercising the embed path.
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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

  function collectImageSrcs(node: unknown, acc: string[] = []): string[] {
    if (Array.isArray(node)) {
      node.forEach((child) => collectImageSrcs(child, acc));
      return acc;
    }
    if (!isValidElement(node)) {
      return acc;
    }
    const props = (node as { props: Record<string, unknown> }).props;
    if (typeof props.src === 'string') {
      acc.push(props.src);
    }
    collectImageSrcs(props.children, acc);
    return acc;
  }

  const calcImageLab: Lab = {
    ...labFixture,
    sections: [
      {
        kind: 'calculation',
        fieldId: 'calc-photo',
        prompt: 'Attach a photo of your work',
        responseMode: 'image',
        imageId: 'photo1',
      },
    ],
  };

  const calcImageAnswers: LabAnswers = {
    ...answersFixture,
    images: {
      photo1: { idbKey: 'idb-photo1', mime: 'image/png', bytes: 68, sha256: 'a'.repeat(64) },
    },
  };

  it('embeds the calculation image as an Image node when data is provided', () => {
    const tree = LabReportDocument({
      lab: calcImageLab,
      answers: calcImageAnswers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
      imageData: { photo1: PNG_DATA_URL },
    });

    expect(collectImageSrcs(tree)).toContain(PNG_DATA_URL);
    expect(collectText(tree)).toContain('Image attached: 68 bytes');
  });

  it('omits the Image node and keeps the caption when image data is absent', () => {
    const tree = LabReportDocument({
      lab: calcImageLab,
      answers: calcImageAnswers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });

    expect(collectImageSrcs(tree)).toHaveLength(0);
    expect(collectText(tree)).toContain('Image attached: 68 bytes');
  });

  it('renders a calculation-image PDF to bytes with the embedded image', async () => {
    const bytes = await renderPDF({
      mode: 'signed',
      lab: calcImageLab,
      answers: calcImageAnswers,
      course: courseFixture,
      images: { photo1: PNG_DATA_URL },
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it('returns Uint8Array bytes in browser-compatible path', async () => {
    const bytes = await renderPDF({
      mode: 'signed',
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

  it('stamps a signed identity watermark and footer on every page', () => {
    const tree = LabReportDocument({
      lab: labFixture,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree);

    // Three pages (cover, body, process record) each carry the marks.
    expect((textDump.match(/Student · SIGNED/g) ?? []).length).toBe(3);
    expect((textDump.match(/Student · signed 2024-04-30T04:06:40\.000Z · 0123456789abcdef/g) ?? [])
      .length).toBe(3);
  });

  it('stamps a DRAFT watermark and footer when unsigned', () => {
    const tree = LabReportDocument({
      lab: labFixture,
      answers: answersFixture,
      course: courseFixture,
      mode: 'draft',
    });
    const textDump = collectText(tree);

    // Diagonal watermark (3 pages) plus the footer line (3 pages).
    expect((textDump.match(/Student · DRAFT(?! -)/g) ?? []).length).toBe(3);
    expect((textDump.match(/Student · DRAFT - not for submission/g) ?? []).length).toBe(3);
    expect(textDump).not.toContain('SIGNED');
  });

  it('keeps only the leading heading of an instructions block and drops the body', () => {
    const markdownLabFixture: Lab = {
      ...labFixture,
      sections: [
        {
          kind: 'instructions',
          html: [
            '## Part 1',
            '**Important:**',
            '- Item one',
            '- Item two',
            'Inline math $\\sin\\theta_i$',
          ].join('\n'),
        },
      ],
    };

    const tree = LabReportDocument({
      lab: markdownLabFixture,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();

    // The part heading survives as an answer-group label.
    expect(textDump).toContain('Part 1');
    // The procedure body (bold note, list items, inline math) is dropped.
    expect(textDump).not.toContain('Item one');
    expect(textDump).not.toContain('Important');
    expect(textDump).not.toContain('sinθᵢ');
    expect(textDump).toMatchInlineSnapshot(`"Student · SIGNEDStudent · signed 2024-04-30T04:06:40.000Z · 0123456789abcdefTest LabTest CourseStudent: StudentSigned: 2024-04-30T04:06:40.000Z - 01234567Integrity statement: I affirm this submission reflects my own work. If AI or LLM tools — chatbots, large language models, or generative AI assistants such as ChatGPT, Claude, Gemini, Copilot, or any similar tool — were used in any part of this lab, the chats are disclosed and share links are provided below (required by course policy).Agreement accepted: 2024-04-30T04:06:40.000ZAI/LLM tools used: NoStudent · SIGNEDStudent · signed 2024-04-30T04:06:40.000Z · 0123456789abcdefPart 1Student · SIGNEDStudent · signed 2024-04-30T04:06:40.000Z · 0123456789abcdefProcess RecordSectionActive timeKeystrokesDeletesPastes (clip / auto / IME)Total0s000 / 0 / 0"`);
  });

  it('includes Snell derived-column formula labels in table text snapshot', () => {
    const snellAnswers: LabAnswers = {
      ...answersFixture,
      tables: {
        part2Table: [
          {
            incidentAngle: {
              text: '10',
              pastes: [],
              meta: { activeMs: 0, keystrokes: 0, deletes: 0 },
            },
            refractedAngle: {
              text: '7',
              pastes: [],
              meta: { activeMs: 0, keystrokes: 0, deletes: 0 },
            },
            sinIncidentAngle: {
              text: '0.1736',
              pastes: [],
              meta: { activeMs: 0, keystrokes: 0, deletes: 0 },
            },
            sinRefractedAngle: {
              text: '0.1219',
              pastes: [],
              meta: { activeMs: 0, keystrokes: 0, deletes: 0 },
            },
          },
        ],
      },
    };

    const tree = LabReportDocument({
      lab: snellsLawLab,
      answers: snellAnswers,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });
    const textDump = collectText(tree).replace(/\s+/g, ' ').trim();
    // Fence the excerpt with anchors intrinsic to the data table itself: the
    // section header at the start and the last row's terminal cell at the end.
    // This keeps the assertion stable against changes to the *next* section's
    // rendered title (e.g. plot label format).
    const start = textDump.indexOf('Data Table');
    const lastCell = '0.1219';
    const lastCellIdx = textDump.indexOf(lastCell, start);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(lastCellIdx).toBeGreaterThan(start);

    const end = lastCellIdx + lastCell.length;
    const tableExcerpt = textDump.slice(start, end).trim();
    expect(tableExcerpt).toContain('sin(theta_i)');
    expect(tableExcerpt).toContain('sin(theta_r)');
    // P-C compaction: only the filled part-2 table is "answered", so it is the
    // first Data Table rendered; the empty part-1 table is collapsed away.
    expect(tableExcerpt).toMatchInlineSnapshot(
      `"Data Table (2 pts)Incident angle (deg)Refracted angle (deg)sin(theta_1)sin(theta_i)sin(theta_A)sin(theta_r)1070.17360.1219"`,
    );

    expect(textDump).toContain('Total: 29 points');
    // The part-2 plot has one point (the filled row), so it still renders fully.
    expect(textDump).toContain('sin(theta_A) vs. sin(theta_1) (1 pts)');
    // Unanswered field-owning sections collapse into one block listing the
    // human titles (the Objective field was left blank here).
    expect(textDump).toMatch(/Unanswered sections \(\d+\):/);
    expect(textDump).toContain('Objective');
  });
});
