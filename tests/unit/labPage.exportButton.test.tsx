import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Course, Lab } from '@/domain/schema';
import '@/main.css';
import { LabPage } from '@/ui/LabPage';

vi.mock('@/services/integrity/sign', () => ({
  signAnswers: vi.fn(() => new Promise<never>(() => {})),
}));

const course: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [{ ref: 'exportBtnTest', labNumber: 1, enabled: true }],
};

const lab: Lab = {
  id: 'exportBtnTest',
  title: 'Export test',
  description: 'test',
  category: 'Physics',
  simulations: {
    sim: {
      title: 'Test Sim',
      url: 'https://example.com',
    },
  },
  sections: [
    {
      kind: 'instructions',
      html: '## Hello',
    },
  ],
};

describe('LabPage export PDF control', () => {
  beforeEach(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = '.lab-header { position: sticky; }';
    document.head.appendChild(styleEl);
  });

  it('renders Export PDF button label', () => {
    render(
      <MemoryRouter>
        <LabPage course={course} lab={lab} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /^export pdf$/i })).toBeInTheDocument();
  });

  it('shows Exporting PDF while export is pending', () => {
    render(
      <MemoryRouter>
        <LabPage course={course} lab={lab} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/student name/i), { target: { value: 'Alex Example' } });

    fireEvent.click(screen.getByRole('button', { name: /^export pdf$/i }));

    expect(screen.getByRole('button', { name: /exporting pdf/i })).toBeInTheDocument();
  });
});
