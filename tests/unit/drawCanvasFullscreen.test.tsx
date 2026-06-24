import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DrawCanvas from '@/ui/primitives/DrawCanvas';

describe('DrawCanvas fullscreen overlay', () => {
  it('opens a modal overlay, locks body scroll, and closes on Escape', () => {
    render(<DrawCanvas value={undefined} onChange={() => {}} label="Show your work" />);

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Draw full screen' }));

    const dialog = screen.getByRole('dialog', { name: 'Drawing: Show your work' });
    expect(dialog).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the Exit button is clicked', () => {
    render(<DrawCanvas value={undefined} onChange={() => {}} label="Show your work" />);

    fireEvent.click(screen.getByRole('button', { name: 'Draw full screen' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exit full screen' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
