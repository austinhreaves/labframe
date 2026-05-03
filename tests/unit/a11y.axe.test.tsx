import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { runAxe } from '../a11y/axe';

vi.mock('react-chartjs-2', () => ({
  Scatter: () => <div role="img" aria-label="scatter chart" />,
}));

describe('A11y axe smoke checks', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.title = 'LabFrame';
  });

  it('has no axe violations on catalog route', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: /interactive physics labs/i });

    const result = await runAxe(container);
    expect(result.violations).toEqual([]);
  });

  it('has no axe violations on a lab route', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/c/phy132/staticElectricity']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('button', { name: /export pdf/i });

    const result = await runAxe(container);
    expect(result.violations).toEqual([]);
  });
});
