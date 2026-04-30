import { useRef, type CompositionEvent, type FormEvent } from 'react';

import type { FieldValue } from '@/domain/schema';
import { appendPasteEvent, createEmptyFieldValue, markFieldActivity } from '@/state/labStore';

type FieldProps = {
  id: string;
  label: string;
  value: FieldValue | undefined;
  multiline?: boolean;
  rows?: number;
  readOnly?: boolean;
  onChange: (next: FieldValue) => void;
};

export function Field({ id, label, value, multiline = false, rows = 4, readOnly = false, onChange }: FieldProps) {
  const effective = value ?? createEmptyFieldValue();
  const focusStartedAt = useRef<number | null>(null);
  const composition = useRef<{ startOffset: number; startText: string } | null>(null);

  const getComposedSubstring = (before: string, after: string, startOffset: number) => {
    const offset = Math.max(0, Math.min(startOffset, after.length));
    let suffixLength = 0;
    while (
      before.length - suffixLength - 1 >= startOffset &&
      after.length - suffixLength - 1 >= offset &&
      before[before.length - suffixLength - 1] === after[after.length - suffixLength - 1]
    ) {
      suffixLength += 1;
    }
    const end = Math.max(offset, after.length - suffixLength);
    return after.slice(offset, end);
  };

  const handleFocus = () => {
    focusStartedAt.current = Date.now();
    if (effective.meta.firstFocusAt !== undefined) {
      return;
    }

    onChange({
      ...effective,
      meta: {
        ...effective.meta,
        firstFocusAt: Date.now(),
      },
    });
  };

  const handleBlur = () => {
    if (focusStartedAt.current === null) {
      return;
    }
    const elapsed = Date.now() - focusStartedAt.current;
    focusStartedAt.current = null;
    onChange({
      ...effective,
      meta: {
        ...effective.meta,
        activeMs: effective.meta.activeMs + Math.max(0, elapsed),
      },
    });
  };

  const handleInput = (event: FormEvent<HTMLInputElement> | FormEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const native = event.nativeEvent as InputEvent;
    const next = markFieldActivity(
      effective,
      { value: target.value, selectionStart: target.selectionStart },
      { inputType: native.inputType, data: native.data, isComposing: native.isComposing },
    );
    onChange(next);
  };

  const handleCompositionStart = (event: CompositionEvent<HTMLInputElement> | CompositionEvent<HTMLTextAreaElement>) => {
    composition.current = {
      startOffset: event.currentTarget.selectionStart ?? effective.text.length,
      startText: effective.text,
    };
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement> | CompositionEvent<HTMLTextAreaElement>) => {
    const snapshot = composition.current;
    composition.current = null;
    if (!snapshot) {
      return;
    }

    const target = event.currentTarget;
    const base = markFieldActivity(effective, { value: target.value, selectionStart: target.selectionStart }, {});
    const composedText = getComposedSubstring(snapshot.startText, target.value, snapshot.startOffset);
    const next = appendPasteEvent(base, 'ime', composedText, snapshot.startOffset);
    onChange(next);
  };

  return (
    <label htmlFor={id} className="field">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={effective.text}
          readOnly={readOnly}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      ) : (
        <input
          id={id}
          value={effective.text}
          readOnly={readOnly}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      )}
    </label>
  );
}
