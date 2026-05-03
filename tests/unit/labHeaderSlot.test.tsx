import { render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { Course, Lab } from '@/domain/schema';
import '@/main.css';
import { LabPage } from '@/ui/LabPage';

const course: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [{ ref: 'headerTest', labNumber: 1, enabled: true }],
};

const lab: Lab = {
  id: 'headerTest',
  title: 'Header test',
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
      html: 'test',
    },
  ],
};

describe('LabPage header shell', () => {
  const styleEl = document.createElement('style');
  styleEl.textContent = '.lab-header { position: sticky; }';
  document.head.appendChild(styleEl);

  it('renders sticky header with persistence controls in the lower band', () => {
    const { container } = render(
      <MemoryRouter>
        <LabPage course={course} lab={lab} />
      </MemoryRouter>,
    );

    const header = container.querySelector('.lab-header');
    const headerBottom = container.querySelector('.lab-header-bottom');

    expect(header).toBeTruthy();
    expect(headerBottom).toBeTruthy();
    expect(window.getComputedStyle(header as HTMLElement).position).toBe('sticky');
    const lowerBandEl = headerBottom as HTMLElement;
    expect(within(lowerBandEl).getByLabelText(/student name/i)).toBeInTheDocument();
    expect(within(lowerBandEl).getByRole('button', { name: /start fresh/i })).toBeInTheDocument();
    expect(within(lowerBandEl).getByText(/not saved yet/i)).toBeInTheDocument();
  });
});
