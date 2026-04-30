import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { createEmptyFieldValue, markFieldActivity } from '@/state/labStore';
import { Field } from '@/ui/primitives/Field';

describe('markFieldActivity', () => {
  it('captures only inserted paste text with the correct offset', () => {
    const previous = createEmptyFieldValue('abcxyz');
    const next = markFieldActivity(
      previous,
      { value: 'abcHELLOxyz', selectionStart: 8 },
      { inputType: 'insertFromPaste', data: null, isComposing: false },
    );

    expect(next.text).toBe('abcHELLOxyz');
    expect(next.pastes).toHaveLength(1);
    expect(next.pastes[0]).toMatchObject({
      source: 'clipboard',
      text: 'HELLO',
      offset: 3,
    });
    expect(next.meta.keystrokes).toBe(0);
    expect(next.meta.deletes).toBe(0);
  });

  it('gates keystrokes and deletes to the expected inputType values', () => {
    const start = createEmptyFieldValue('ab');

    const fromInsertText = markFieldActivity(
      start,
      { value: 'abc', selectionStart: 3 },
      { inputType: 'insertText', data: 'c', isComposing: false },
    );
    expect(fromInsertText.meta.keystrokes).toBe(1);
    expect(fromInsertText.meta.deletes).toBe(0);

    const fromReplacement = markFieldActivity(
      fromInsertText,
      { value: 'abc1', selectionStart: 4 },
      { inputType: 'insertReplacementText', data: '1', isComposing: false },
    );
    expect(fromReplacement.meta.keystrokes).toBe(1);
    expect(fromReplacement.meta.deletes).toBe(0);
    expect(fromReplacement.pastes[fromReplacement.pastes.length - 1]).toMatchObject({
      source: 'autocomplete',
      text: '1',
      offset: 3,
    });

    const fromDelete = markFieldActivity(
      fromReplacement,
      { value: 'abc', selectionStart: 3 },
      { inputType: 'deleteContentBackward', data: null, isComposing: false },
    );
    expect(fromDelete.meta.keystrokes).toBe(1);
    expect(fromDelete.meta.deletes).toBe(1);
  });
});

function FieldHarness() {
  const [value, setValue] = useState(createEmptyFieldValue());
  return (
    <>
      <Field id="ime-field" label="IME Field" value={value} onChange={setValue} />
      <output data-testid="field-value">{JSON.stringify(value)}</output>
    </>
  );
}

describe('Field IME handling', () => {
  it('emits one IME paste record after compositionend', () => {
    render(<FieldHarness />);
    const input = screen.getByLabelText('IME Field') as HTMLInputElement;

    input.setSelectionRange(0, 0);
    fireEvent.compositionStart(input);

    input.setSelectionRange(1, 1);
    fireEvent.input(input, { target: { value: 'あ' }, inputType: 'insertCompositionText', data: 'あ', isComposing: true });

    input.setSelectionRange(2, 2);
    fireEvent.input(input, { target: { value: 'あい' }, inputType: 'insertCompositionText', data: 'い', isComposing: true });

    fireEvent.compositionEnd(input);

    const finalValue = JSON.parse(screen.getByTestId('field-value').textContent ?? '{}');
    expect(finalValue.text).toBe('あい');
    expect(finalValue.meta.keystrokes).toBe(0);
    expect(finalValue.pastes).toHaveLength(1);
    expect(finalValue.pastes[0]).toMatchObject({
      source: 'ime',
      text: 'あい',
      offset: 0,
    });
  });
});
