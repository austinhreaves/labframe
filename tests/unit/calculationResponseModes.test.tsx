import { Suspense } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { isValidElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { drawPageKey } from '@/domain/calculationResponse';
import type { CalculationSection, Course, Lab, LabAnswers } from '@/domain/schema';
import { LabReportDocument } from '@/services/pdf/Document';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { CalculationSectionView } from '@/ui/sections/CalculationSectionView';
import { serializeDrawing } from '@/ui/primitives/drawStrokes';

const oneStrokeDrawing = serializeDrawing({
  version: 3,
  pages: [{ strokes: [{ color: '#111827', width: 3.5, points: [{ x: 10, y: 10, pressure: 0 }] }] }],
});
const c1DrawPageKey = drawPageKey('c1', 1);

const selectableSection: CalculationSection = {
  kind: 'calculation',
  fieldId: 'c1',
  prompt: 'Show your work',
  responseModes: ['text', 'draw', 'image'],
};

function renderSection(section: CalculationSection) {
  return render(
    <Suspense fallback={null}>
      <CalculationSectionView section={section} />
    </Suspense>,
  );
}

describe('CalculationSectionView response-mode switcher', () => {
  beforeEach(() => {
    useLabStore.setState({
      fields: { c1: createEmptyFieldValue('typed work') },
      images: {},
      responseSelections: { c1: 'text' },
    });
  });

  it('renders a tab per allowed mode with the first as the default selection', async () => {
    renderSection(selectableSection);
    const typeTab = await screen.findByRole('tab', { name: 'Type' });
    expect(typeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Draw' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Photo' })).toHaveAttribute('aria-selected', 'false');
  });

  it('preserves each mode answer when the student switches modes', async () => {
    renderSection(selectableSection);
    expect(await screen.findByLabelText('Show your work')).toHaveValue('typed work');

    fireEvent.click(screen.getByRole('tab', { name: 'Photo' }));

    // Switching to photo shows the uploader and leaves the typed answer intact.
    expect(await screen.findByLabelText('Upload image')).toBeInTheDocument();
    expect(useLabStore.getState().fields.c1?.text).toBe('typed work');

    fireEvent.click(screen.getByRole('tab', { name: 'Type' }));
    expect(await screen.findByLabelText('Show your work')).toHaveValue('typed work');
  });

  it('renders no switcher for a single-mode section', async () => {
    renderSection({ kind: 'calculation', fieldId: 'c1', prompt: 'Show your work' });
    expect(await screen.findByLabelText('Show your work')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});

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
  description: 'Selectable calculation lab.',
  category: 'Physics',
  simulations: {},
  sections: [
    {
      kind: 'calculation',
      fieldId: 'c1',
      prompt: 'Show your work',
      responseModes: ['text', 'draw'],
    },
  ],
};

const baseAnswers: LabAnswers = {
  schemaVersion: 4,
  meta: { studentName: 'Student', semester: 'Fall', session: 'C', year: '2026', taName: 'TA' },
  integrity: {
    signedAs: 'Student',
    aiUsed: false,
    agreementAccepted: true,
    agreementAcceptedAt: 1714450000000,
    agreementText: 'Affirmation.',
  },
  fields: {
    c1: { text: 'typed answer', pastes: [], meta: { activeMs: 0, keystrokes: 0, deletes: 0 } },
    c1__draw: { ...createEmptyFieldValue(), text: oneStrokeDrawing },
  },
  tables: {},
  selectedFits: {},
  images: {
    [c1DrawPageKey]: {
      idbKey: c1DrawPageKey,
      mime: 'image/png',
      bytes: 99,
      sha256: 'c'.repeat(64),
    },
  },
  fits: {},
  status: { submitted: false, lastSavedAt: 0 },
};

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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

describe('PDF renders the active selected mode', () => {
  it('renders the typed answer when text is selected', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: { ...baseAnswers, responseSelections: { c1: 'text' } },
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
      imageData: { [c1DrawPageKey]: PNG_DATA_URL },
    });

    expect(collectText(tree)).toContain('typed answer');
    expect(collectImageSrcs(tree)).not.toContain(PNG_DATA_URL);
  });

  it('embeds the drawing when draw is selected', () => {
    const tree = LabReportDocument({
      lab: drawLab,
      answers: { ...baseAnswers, responseSelections: { c1: 'draw' } },
      course: courseFixture,
      mode: 'signed',
      signature: '0123456789abcdef0123456789abcdef',
      signedAt: 1714450000000,
      imageData: { [c1DrawPageKey]: PNG_DATA_URL },
    });

    expect(collectImageSrcs(tree)).toContain(PNG_DATA_URL);
    expect(collectText(tree)).toContain('Drawing attached: 99 bytes');
  });
});
