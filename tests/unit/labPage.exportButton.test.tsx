import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Course, Lab } from '@/domain/schema';
import '@/main.css';
import { useLabStore } from '@/state/labStore';
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

function renderLab() {
  return render(
    <MemoryRouter>
      <LabPage course={course} lab={lab} />
    </MemoryRouter>,
  );
}

describe('LabPage export PDF control', () => {
  beforeEach(() => {
    // Seed a valid name in the store so the on-load StudentNameGateDialog stays
    // closed; jsdom has no IndexedDB, so the localStorage seed + key-migration
    // path the e2e suite uses is not available here.
    useLabStore.setState({ studentName: 'Seeded Name' });
    const styleEl = document.createElement('style');
    styleEl.textContent = '.lab-header { position: sticky; }';
    document.head.appendChild(styleEl);
  });

  it('removes Export PDF from the header and renders it inside the integrity agreement', () => {
    renderLab();

    const headerActions = document.querySelector('.lab-header-actions');
    expect(headerActions).not.toBeNull();
    expect(
      within(headerActions as HTMLElement).queryByRole('button', { name: /^export pdf$/i }),
    ).toBeNull();

    const agreement = document.querySelector('.integrity-agreement');
    expect(agreement).not.toBeNull();
    expect(
      within(agreement as HTMLElement).getByRole('button', { name: /^export pdf$/i }),
    ).toBeInTheDocument();
  });

  it('disables Export PDF until the integrity checkbox is checked', () => {
    renderLab();

    fireEvent.change(screen.getByLabelText(/student name/i), { target: { value: 'Alex Example' } });
    const exportBtn = screen.getByRole('button', { name: /^export pdf$/i });
    expect(exportBtn).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /i affirm this submission/i }));
    expect(exportBtn).toBeEnabled();
  });

  it('keeps Export PDF disabled when AI was used but no share links are provided', () => {
    renderLab();

    fireEvent.change(screen.getByLabelText(/student name/i), { target: { value: 'Alex Example' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /i affirm this submission/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /i used ai or llm tools/i }));

    const exportBtn = screen.getByRole('button', { name: /^export pdf$/i });
    expect(exportBtn).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/add at least one share link/i);

    fireEvent.change(screen.getByLabelText(/paste share links/i), {
      target: { value: 'https://chat.example/abc' },
    });
    expect(exportBtn).toBeEnabled();
  });

  it('shows Exporting PDF while export is pending', () => {
    renderLab();

    fireEvent.change(screen.getByLabelText(/student name/i), { target: { value: 'Alex Example' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /i affirm this submission/i }));
    fireEvent.click(screen.getByRole('button', { name: /^export pdf$/i }));

    expect(screen.getByRole('button', { name: /exporting pdf/i })).toBeInTheDocument();
  });
});
