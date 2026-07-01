import { useRef, type CompositionEvent, type FormEvent, type ReactNode } from 'react';

import type { FieldValue } from '@/domain/schema';
import { appendPasteEvent, createEmptyFieldValue, markFieldActivity } from '@/state/labStore';
import { useActiveTime } from '@/ui/primitives/useActiveTime';

type FieldProps = {
  id: string;
  /** Plain-text accessible name. Always present in the DOM so screen readers can read it,
   *  even when `labelDisplay` provides a richer visible rendering. */
  label: string;
  /** Optional rich rendering for the visible label (e.g. markdown/KaTeX). Replaces the
   *  default `<span>{label}</span>` content when provided. */
  labelDisplay?: ReactNode;
  /** Visually hide the label (still in the DOM for assistive tech). Use when the visible
   *  prompt is rendered separately above the field. */
  hideLabel?: boolean;
  value: FieldValue | undefined;
  multiline?: boolean;
  rows?: number;
  readOnly?: boolean;
  onChange: (next: FieldValue) => void;
};

export function Field({
  id,
  label,
  labelDisplay,
  hideLabel = false,
  value,
  multiline = false,
  rows = 4,
  readOnly = false,
  onChange,
}: FieldProps) {
  const effective = value ?? createEmptyFieldValue();
  const composition = useRef<{ startOffset: number; startText: string } | null>(null);
  const { onFocus, onBlur } = useActiveTime({ value: effective, onChange });

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

  const handleCompositionStart = (
    event: CompositionEvent<HTMLInputElement> | CompositionEvent<HTMLTextAreaElement>,
  ) => {
    composition.current = {
      startOffset: event.currentTarget.selectionStart ?? effective.text.length,
      startText: effective.text,
    };
  };

  const handleCompositionEnd = (
    event: CompositionEvent<HTMLInputElement> | CompositionEvent<HTMLTextAreaElement>,
  ) => {
    const snapshot = composition.current;
    composition.current = null;
    if (!snapshot) {
      return;
    }

    const target = event.currentTarget;
    const base = markFieldActivity(
      effective,
      { value: target.value, selectionStart: target.selectionStart },
      {},
    );
    const composedText = getComposedSubstring(
      snapshot.startText,
      target.value,
      snapshot.startOffset,
    );
    const next = appendPasteEvent(base, 'ime', composedText, snapshot.startOffset);
    onChange(next);
  };

  return (
    <label htmlFor={id} className="field">
      <span className={hideLabel ? 'field-label visually-hidden' : 'field-label'}>
        {labelDisplay ?? label}
      </span>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={effective.text}
          readOnly={readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      ) : (
        <input
          id={id}
          value={effective.text}
          readOnly={readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      )}
    </label>
  );
}
