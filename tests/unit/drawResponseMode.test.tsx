import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import type { Course, Lab, LabAnswers } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';
import { drawPageKey, drawStorageKey } from '@/domain/calculationResponse';
import { collectDrawArtifacts } from '@/services/pdf/collectDrawImages';
import { createEmptyFieldValue } from '@/state/labStore';
import { serializeDrawing, type DrawDrawing } from '@/ui/primitives/drawStrokes';

const courseFixture: Course = {
  id: 'course-1',
  title: 'Test Course',
  storagePrefix: 'test',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab-1', enabled: true }],
};

const drawLab: Lab = {
  id: 'lab-1',
  title: 'Test Lab',
  description: 'Free-draw calculation lab.',
  category: 'Physics',
  simulations: {},
  sections: [{ kind: 'calculation', fieldId: 'hand-calc', prompt: 'Show your work', responseMode: 'draw' }],
};

const oneStrokeDrawing = serializeDrawing({
  version: 3,
  pages: [
    {
      strokes: [
        {
          color: '#111827',
          width: 3.5,
          points: [
            { x: 10, y: 10, pressure: 0 },
            { x: 20, y: 20, pressure: 0 },
          ],
        },
      ],
    },
  ],
});

const drawKey = drawStorageKey('hand-calc');
const pageKey = drawPageKey('hand-calc', 1);

const answersFixture: LabAnswers = {
  schemaVersion: 4,
  meta: { studentName: 'Student', semester: 'Fall', session: 'C', year: '2026', taName: 'TA' },
  integrity: {
    signedAs: 'Student',
    aiUsed: false,
    agreementAccepted: true,
    agreementAcceptedAt: 1714450000000,
    agreementText: 'Affirmation.',
  },
  fields: { [drawKey]: { ...createEmptyFieldValue(), text: oneStrokeDrawing } },
  tables: {},
  selectedFits: {},
  images: { [pageKey]: { idbKey: pageKey, mime: 'image/png', bytes: 128, sha256: 'b'.repeat(64) } },
  fits: {},
  status: { submitted: false, lastSavedAt: 0 },
};

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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

describe('calculation draw response mode in the PDF', () => {
  it('embeds the rasterized page and reports its byte count', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
      imageData: { [pageKey]: PNG_DATA_URL },
    });

    expect(collectImageSrcs(tree)).toContain(PNG_DATA_URL);
    expect(collectText(tree)).toContain('Drawing attached: 128 bytes');
  });

  it('shows the empty-state note when no page rasterized', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });

    expect(collectImageSrcs(tree)).toHaveLength(0);
    expect(collectText(tree)).toContain('No drawing attached');
  });
});

describe('collectDrawArtifacts', () => {
  it('returns nothing for labs with no draw sections', async () => {
    const textLab: Lab = {
      ...drawLab,
      sections: [{ kind: 'calculation', fieldId: 'c1', prompt: 'Typed answer' }],
    };
    const artifacts = await collectDrawArtifacts(textLab, {});
    expect(artifacts.dataUrls).toEqual({});
    expect(artifacts.blobRefs).toEqual({});
  });

  it('skips pages with no strokes', async () => {
    const emptyDoc: DrawDrawing = { version: 3, pages: [{ strokes: [] }] };
    const fields = {
      [drawKey]: { ...createEmptyFieldValue(), text: serializeDrawing(emptyDoc) },
    };
    const artifacts = await collectDrawArtifacts(drawLab, fields);
    expect(artifacts.blobRefs).toEqual({});
  });
});
