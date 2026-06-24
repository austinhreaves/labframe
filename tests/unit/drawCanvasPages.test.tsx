import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DrawCanvas from '@/ui/primitives/DrawCanvas';
import { parseDrawing } from '@/ui/primitives/drawStrokes';

describe('DrawCanvas multi-page controls', () => {
  it('adds pages, persists the page count, and navigates between them', () => {
    let serialized: string | undefined;
    render(<DrawCanvas value={undefined} onChange={(next) => (serialized = next)} label="Work" />);

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add page' }));

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(parseDrawing(serialized)?.pages).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('disables Delete page at a single page and removes the current page otherwise', () => {
    render(<DrawCanvas value={undefined} onChange={() => {}} label="Work" />);

    expect(screen.getByRole('button', { name: 'Delete page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Add page' }));
    expect(screen.getByRole('button', { name: 'Delete page' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }));
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
