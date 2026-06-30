import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App routes', () => {
  it('renders catalog heading', () => {
    // A returning (onboarded) student sees the normal catalog, not the
    // first-run onboarding splash.
    localStorage.setItem('labframe:onboarded', '1');
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('heading', { name: /LabFrame/i }).length).toBeGreaterThan(0);
  });
});
