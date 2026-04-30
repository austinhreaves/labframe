import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App routes', () => {
  it('renders catalog heading', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('heading', { name: /interactive physics labs/i }).length).toBeGreaterThan(0);
  });
});
