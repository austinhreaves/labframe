import { createElement, useEffect, useRef, useState, type CompositionEvent, type FormEvent } from 'react';
import type { FieldValue } from '@/domain/schema';

import { appendPasteEvent, createEmptyFieldValue, markFieldActivity } from '@/state/labStore';
import { Field } from '@/ui/primitives/Field';

type EquationEditorProps = {
  id: string;
  label: string;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
};

type MathFieldElement = HTMLElement & {
  value: string;
  selectionStart?: number | null;
  position?: number;
};

export function EquationEditor({ id, label, value, onChange }: EquationEditorProps) {
  const effective = value ?? createEmptyFieldValue();
  const [isReady, setIsReady] = useState(false);
  const focusStartedAt = useRef<number | null>(null);
  const composition = useRef<{ startOffset: number; startText: string } | null>(null);
  const mathFieldRef = useRef<MathFieldElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!document.getElementById('mathlive-runtime-css')) {
        const link = document.createElement('link');
        link.id = 'mathlive-runtime-css';
        link.rel = 'stylesheet';
        link.href = new URL('./mathlive.css', import.meta.url).href;
        document.head.appendChild(link);
      }
      await import('mathlive');
      if (isMounted) {
        setIsReady(true);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const field = mathFieldRef.current;
    if (field && field.value !== effective.text) {
      field.value = effective.text;
    }
  }, [effective.text, isReady]);

  const getSelectionStart = (target: MathFieldElement): number => {
    if (typeof target.selectionStart === 'number') {
      return target.selectionStart;
    }
    if (typeof target.position === 'number') {
      return target.position;
    }
    return typeof target.value === 'string' ? target.value.length : 0;
  };

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

  if (!isReady) {
    return <Field id={id} label={label} value={value} multiline rows={4} onChange={onChange} />;
  }

  return (
    <label htmlFor={id} className="field">
      <span className="field-label">{label}</span>
      {createElement('math-field', {
        id,
        ref: (element: MathFieldElement | null): void => {
          mathFieldRef.current = element;
        },
        onFocus: () => {
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
        },
        onBlur: () => {
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
        },
        onCompositionStart: (event: CompositionEvent<MathFieldElement>) => {
          const target = event.currentTarget;
          composition.current = {
            startOffset: getSelectionStart(target),
            startText: effective.text,
          };
        },
        onCompositionEnd: (event: CompositionEvent<MathFieldElement>) => {
          const snapshot = composition.current;
          composition.current = null;
          if (!snapshot) {
            return;
          }

          const target = event.currentTarget;
          const targetValue = target.value ?? '';
          const base = markFieldActivity(effective, { value: targetValue, selectionStart: getSelectionStart(target) }, {});
          const composedText = getComposedSubstring(snapshot.startText, targetValue, snapshot.startOffset);
          onChange(appendPasteEvent(base, 'ime', composedText, snapshot.startOffset));
        },
        onInput: (event: FormEvent<MathFieldElement>) => {
          const target = event.currentTarget;
          const native = event.nativeEvent as InputEvent;
          const targetValue = target.value ?? '';
          const next = markFieldActivity(
            effective,
            { value: targetValue, selectionStart: getSelectionStart(target) },
            { inputType: native.inputType, data: native.data, isComposing: native.isComposing },
          );
          onChange(next);
        },
      })}
    </label>
  );
}
