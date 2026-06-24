import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import type { Course, Lab, LabAnswers } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';
import { drawStorageKey } from '@/domain/calculationResponse';
import { collectDrawArtifacts } from '@/services/pdf/collectDrawImages';
import { createEmptyFieldValue } from '@/state/labStore';
import { serializeDrawing, type DrawDocument } from '@/ui/primitives/drawStrokes';

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
  fields: {},
  tables: {},
  selectedFits: {},
  images: { 'hand-calc__draw': { idbKey: 'hand-calc__draw', mime: 'image/png', bytes: 128, sha256: 'b'.repeat(64) } },
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
  it('embeds the rasterized drawing and reports its byte count', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
      imageData: { 'hand-calc__draw': PNG_DATA_URL },
    });

    expect(collectImageSrcs(tree)).toContain(PNG_DATA_URL);
    expect(collectText(tree)).toContain('Drawing attached: 128 bytes');
  });

  it('keeps the caption but omits the image when no drawing was rasterized', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: answersFixture,
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
    });

    expect(collectImageSrcs(tree)).toHaveLength(0);
    expect(collectText(tree)).toContain('Drawing attached: 128 bytes');
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

  it('skips draw sections whose stored drawing has no strokes', async () => {
    const emptyDoc: DrawDocument = { version: 2, strokes: [] };
    const fields = {
      [drawStorageKey('hand-calc')]: { ...createEmptyFieldValue(), text: serializeDrawing(emptyDoc) },
    };
    const artifacts = await collectDrawArtifacts(drawLab, fields);
    expect(artifacts.blobRefs).toEqual({});
  });
});
