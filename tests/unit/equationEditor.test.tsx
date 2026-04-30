import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyFieldValue } from '@/state/labStore';
import { EquationEditor } from '@/ui/primitives/EquationEditor';

vi.mock('mathlive', () => ({}));
vi.mock('mathlive/static.css', () => ({}));

describe('EquationEditor', () => {
  it('shows fallback first, then mounts math-field after dynamic import', async () => {
    const { container } = render(
      <EquationEditor id="eq" label="Equation" value={createEmptyFieldValue('a+b')} onChange={vi.fn()} />,
    );

    expect(container.querySelector('textarea')).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector('math-field')).toBeTruthy();
    });
  });

  it('produces a keystroke patch on typed input', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <EquationEditor id="eq2" label="Equation 2" value={createEmptyFieldValue()} onChange={onChange} />,
    );

    await waitFor(() => {
      expect(container.querySelector('math-field')).toBeTruthy();
    });

    const mathField = container.querySelector('math-field') as HTMLElement & { value: string; selectionStart: number };
    mathField.value = 'x';
    mathField.selectionStart = 1;
    fireEvent.input(mathField, { inputType: 'insertText', data: 'x', isComposing: false });

    const latest = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(latest?.text).toBe('x');
    expect(latest?.meta?.keystrokes).toBe(1);
  });
});
