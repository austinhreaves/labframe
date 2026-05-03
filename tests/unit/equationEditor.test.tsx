import { useState } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldValue } from '@/domain/schema';
import { createEmptyFieldValue } from '@/state/labStore';
import { EquationEditor } from '@/ui/primitives/EquationEditor';

vi.mock('mathlive', () => ({}));
vi.mock('mathlive/static.css', () => ({}));

type MathFieldTestElement = HTMLElement & {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  executeCommand?: (command: unknown) => void;
};

function StatefulEditor({
  initialText = '',
  onPatch,
}: {
  initialText?: string;
  onPatch?: (value: FieldValue) => void;
}) {
  const [value, setValue] = useState(createEmptyFieldValue(initialText));
  return (
    <EquationEditor
      id="eq"
      label="Equation"
      value={value}
      onChange={(next) => {
        onPatch?.(next);
        setValue(next);
      }}
    />
  );
}

async function waitForMathField(container: HTMLElement): Promise<MathFieldTestElement> {
  await waitFor(() => {
    expect(container.querySelector('math-field')).toBeTruthy();
  });
  return container.querySelector('math-field') as MathFieldTestElement;
}

function firePaste(target: Element, text: string): void {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: () => text,
    },
  });
  fireEvent(target, event);
}

describe('EquationEditor', () => {
  it('shows fallback first, then mounts math-field after dynamic import', async () => {
    const { container } = render(<StatefulEditor initialText="a+b" />);

    expect(container.querySelector('textarea')).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector('math-field')).toBeTruthy();
    });
  });

  it('produces a keystroke patch on typed input', async () => {
    const onChange = vi.fn();
    const { container } = render(<StatefulEditor onPatch={onChange} />);

    const mathField = await waitForMathField(container);
    mathField.value = 'x';
    mathField.selectionStart = 1;
    mathField.selectionEnd = 1;
    fireEvent.input(mathField, { inputType: 'insertText', data: 'x', isComposing: false });

    const latest = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(latest?.text).toBe('x');
    expect(latest?.meta?.keystrokes).toBe(1);
  });

  it('records paste events for latex-like clipboard text in math mode', async () => {
    let latest: FieldValue | undefined;
    const { container } = render(<StatefulEditor onPatch={(value) => (latest = value)} />);
    const mathField = await waitForMathField(container);
    mathField.value = 'E=';
    mathField.selectionStart = 2;
    mathField.selectionEnd = 2;

    firePaste(mathField, '\\frac{mc^2}{2}');

    expect(latest?.text).toContain('\\frac{mc^2}{2}');
    expect(latest?.pastes.at(-1)?.source).toBe('clipboard');
    expect(latest?.pastes.at(-1)?.text).toBe('\\frac{mc^2}{2}');
  });

  it('records exactly one ime paste event on compositionend', async () => {
    let latest: FieldValue | undefined;
    const { container } = render(<StatefulEditor onPatch={(value) => (latest = value)} />);
    const mathField = await waitForMathField(container);

    mathField.value = '';
    mathField.selectionStart = 0;
    mathField.selectionEnd = 0;
    fireEvent.compositionStart(mathField);

    mathField.value = 'あ';
    mathField.selectionStart = 1;
    mathField.selectionEnd = 1;
    fireEvent.input(mathField, { inputType: 'insertCompositionText', data: 'あ', isComposing: true });
    fireEvent.compositionEnd(mathField);

    const imeEvents = latest?.pastes.filter((paste) => paste.source === 'ime') ?? [];
    expect(imeEvents).toHaveLength(1);
    expect(imeEvents[0]?.text).toBe('あ');
  });

  it('toggles between math and latex modes while preserving value text', async () => {
    const { container, getByRole } = render(<StatefulEditor initialText="a+b" />);
    await waitForMathField(container);

    fireEvent.click(getByRole('button', { name: 'View as LaTeX' }));
    const sourceInput = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(sourceInput.value).toBe('a+b');

    sourceInput.value = 'a+b+c';
    sourceInput.selectionStart = sourceInput.value.length;
    sourceInput.selectionEnd = sourceInput.value.length;
    fireEvent.input(sourceInput, { inputType: 'insertText', data: 'c', isComposing: false });

    fireEvent.click(getByRole('button', { name: 'View as math' }));
    await waitForMathField(container);
    expect(container.querySelector('pre')?.textContent).toBe('a+b+c');
  });

  it('inserts alpha from palette in both math and latex modes', async () => {
    const { container, getByRole } = render(<StatefulEditor initialText="x" />);
    const mathField = await waitForMathField(container);
    mathField.value = 'x';
    mathField.selectionStart = 1;
    mathField.selectionEnd = 1;

    fireEvent.click(getByRole('button', { name: 'Insert \\alpha' }));
    expect(mathField.value).toBe('x\\alpha');

    fireEvent.click(getByRole('button', { name: 'View as LaTeX' }));
    const sourceInput = container.querySelector('textarea') as HTMLTextAreaElement;
    sourceInput.selectionStart = sourceInput.value.length;
    sourceInput.selectionEnd = sourceInput.value.length;
    fireEvent.click(getByRole('button', { name: 'Insert \\alpha' }));
    expect(sourceInput.value).toBe('x\\alpha\\alpha');
  });

  it('Enter in math mode wraps value in \\begin{gathered}', async () => {
    let latest: FieldValue | undefined;
    const { container } = render(<StatefulEditor initialText="a+b" onPatch={(value) => (latest = value)} />);
    const mathField = await waitForMathField(container);
    mathField.value = 'a+b';
    mathField.selectionStart = 3;
    mathField.selectionEnd = 3;

    const beforeKeystrokes = latest?.meta.keystrokes ?? 0;
    fireEvent.keyDown(mathField, { key: 'Enter', shiftKey: false });

    expect(latest?.text).toContain('\\begin{gathered}');
    expect(latest?.text).toContain('a+b');
    expect(latest?.text).toContain('\\\\');
    expect(latest?.meta.keystrokes).toBe(beforeKeystrokes + 1);
  });

  it('subsequent Enter calls addRowAfter', async () => {
    const { container } = render(<StatefulEditor initialText="a+b" />);
    const mathField = await waitForMathField(container);
    mathField.value = 'a+b';
    mathField.selectionStart = 3;
    mathField.selectionEnd = 3;

    fireEvent.keyDown(mathField, { key: 'Enter', shiftKey: false });

    const executeCommand = vi.fn();
    mathField.executeCommand = executeCommand;
    fireEvent.keyDown(mathField, { key: 'Enter', shiftKey: false });

    expect(executeCommand).toHaveBeenCalledWith(['addRowAfter']);
  });

  it('quick-row alpha button is reachable without opening popover', async () => {
    const { container, getAllByRole } = render(<StatefulEditor />);
    await waitForMathField(container);

    const alphaButtons = getAllByRole('button', { name: 'Insert \\alpha' });
    expect(alphaButtons).toHaveLength(1);
    expect(alphaButtons[0]?.closest('details')).toBeNull();
  });

  it('popover starts closed and opens on summary click', async () => {
    const { container, getByText, getByRole } = render(<StatefulEditor />);
    await waitForMathField(container);

    const summary = getByText('More ▾');
    const details = summary.closest('details');
    expect(details?.hasAttribute('open')).toBe(false);

    fireEvent.click(summary);

    expect(details?.hasAttribute('open')).toBe(true);
    fireEvent.click(getByRole('tab', { name: 'Operators' }));
    expect(getByRole('button', { name: 'Insert \\nabla' })).toBeTruthy();
  });

  it('copies latex source text from preview', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { container, getByRole } = render(<StatefulEditor initialText="F=ma" />);
    await waitForMathField(container);
    fireEvent.click(getByRole('button', { name: 'Copy LaTeX' }));

    expect(container.querySelector('pre')?.textContent).toBe('F=ma');
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('F=ma');
    });
  });

  it('renders katex preview in latex mode', async () => {
    const { container, getByRole } = render(<StatefulEditor />);
    await waitForMathField(container);

    fireEvent.click(getByRole('button', { name: 'View as LaTeX' }));
    const sourceInput = container.querySelector('textarea') as HTMLTextAreaElement;
    sourceInput.value = '\\sin\\theta';
    sourceInput.selectionStart = sourceInput.value.length;
    sourceInput.selectionEnd = sourceInput.value.length;
    fireEvent.input(sourceInput, { inputType: 'insertText', data: '\\theta', isComposing: false });

    const preview = container.querySelector('.equation-editor-katex');
    expect(preview?.innerHTML).toContain('sin');
    expect(preview?.textContent).toContain('θ');
  });

  it('keeps field activity capture working across both modes', async () => {
    let latest: FieldValue | undefined;
    const { container, getByRole } = render(<StatefulEditor onPatch={(value) => (latest = value)} />);

    const mathField = await waitForMathField(container);
    mathField.value = 'x';
    mathField.selectionStart = 1;
    mathField.selectionEnd = 1;
    fireEvent.input(mathField, { inputType: 'insertText', data: 'x', isComposing: false });

    fireEvent.click(getByRole('button', { name: 'View as LaTeX' }));
    const sourceInput = container.querySelector('textarea') as HTMLTextAreaElement;
    sourceInput.value = 'xy';
    sourceInput.selectionStart = 2;
    sourceInput.selectionEnd = 2;
    fireEvent.input(sourceInput, { inputType: 'insertText', data: 'y', isComposing: false });

    expect(latest?.meta.keystrokes).toBe(2);
    expect(latest?.text).toBe('xy');
  });
});
