import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SplitHandle } from '@/ui/layout/SplitHandle';

describe('SplitHandle', () => {
  it('supports keyboard adjustments and clamps to bounds', () => {
    const onChange = vi.fn();
    render(<SplitHandle splitFraction={0.6} onChange={onChange} />);
    const handle = screen.getByRole('separator');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(handle, { key: 'Home' });
    fireEvent.keyDown(handle, { key: 'End' });

    expect(onChange).toHaveBeenCalledWith(0.62);
    expect(onChange).toHaveBeenCalledWith(0.58);
    expect(onChange).toHaveBeenCalledWith(0.7);
    expect(onChange).toHaveBeenCalledWith(0.25);
    expect(onChange).toHaveBeenCalledWith(0.75);
  });

  it('captures pointer drag and clamps updates', () => {
    const onChange = vi.fn();
    const { container } = render(
      <div style={{ width: '1000px' }}>
        <SplitHandle splitFraction={0.6} onChange={onChange} />
      </div>,
    );
    const handle = screen.getByRole('separator');

    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn();
    Object.defineProperty(handle, 'setPointerCapture', { value: setPointerCapture });
    Object.defineProperty(handle, 'releasePointerCapture', { value: releasePointerCapture });
    Object.defineProperty(handle, 'hasPointerCapture', { value: vi.fn(() => true) });
    Object.defineProperty(container.firstElementChild, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 1000 }),
    });

    const down = new Event('pointerdown', { bubbles: true });
    Object.assign(down, { pointerId: 1, clientX: 600, buttons: 1 });
    fireEvent(handle, down);

    const moveLeft = new Event('pointermove', { bubbles: true });
    Object.assign(moveLeft, { pointerId: 1, clientX: 100, buttons: 1 });
    fireEvent(window, moveLeft);

    const moveRight = new Event('pointermove', { bubbles: true });
    Object.assign(moveRight, { pointerId: 1, clientX: 900, buttons: 1 });
    fireEvent(window, moveRight);

    const up = new Event('pointerup', { bubbles: true });
    Object.assign(up, { pointerId: 1, clientX: 900, buttons: 0 });
    fireEvent(window, up);

    expect(setPointerCapture).toHaveBeenCalledTimes(1);
    expect(releasePointerCapture).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(0.6);
    expect(onChange).toHaveBeenCalledWith(0.25);
    expect(onChange).toHaveBeenCalledWith(0.75);
  });
});
