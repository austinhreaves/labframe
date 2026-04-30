import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LayoutToggle } from '@/ui/layout/LayoutToggle';

describe('LayoutToggle contrast styles', () => {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    button { color: #111; background: #fff; border: 1px solid #bbb; }
    button[aria-pressed='true'] { background: #1558d6; color: #fff; border-color: #1558d6; }
  `;
  document.head.appendChild(styleEl);

  it('sets explicit text colors and distinct pressed/unpressed backgrounds', () => {
    render(<LayoutToggle layout="tabs" onChange={() => undefined} />);

    const sideButton = screen.getByRole('button', { name: /side by side/i });
    const tabsButton = screen.getByRole('button', { name: /tabs/i });
    const sideStyle = window.getComputedStyle(sideButton);
    const tabsStyle = window.getComputedStyle(tabsButton);

    expect(sideStyle.color).not.toBe('');
    expect(tabsStyle.color).not.toBe('');
    expect(sideStyle.backgroundColor).not.toBe(tabsStyle.backgroundColor);
  });
});
