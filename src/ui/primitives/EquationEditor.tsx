import katex from 'katex';
import { createElement, useEffect, useMemo, useRef, useState, type ClipboardEvent, type CompositionEvent, type FormEvent, type KeyboardEvent } from 'react';
import type { FieldValue } from '@/domain/schema';

import { appendPasteEvent, createEmptyFieldValue, markFieldActivity } from '@/state/labStore';
import { EquationSymbolPalette } from '@/ui/primitives/EquationSymbolPalette';
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
  selectionEnd?: number | null;
  position?: number;
  executeCommand?: (command: unknown) => void;
};

export function EquationEditor({ id, label, value, onChange }: EquationEditorProps) {
  const effective = value ?? createEmptyFieldValue();
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<'math' | 'latex'>('math');
  const focusStartedAt = useRef<number | null>(null);
  const composition = useRef<{ startOffset: number; startText: string } | null>(null);
  const mathFieldRef = useRef<MathFieldElement | null>(null);
  const latexInputRef = useRef<HTMLTextAreaElement | null>(null);
  const ignoreNextInputValue = useRef<string | null>(null);

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
      try {
        await import('mathlive');
        if (isMounted) {
          setIsReady(true);
        }
      } catch {
        if (isMounted) {
          setIsReady(false);
        }
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

  const getSelectionEnd = (target: MathFieldElement): number => {
    if (typeof target.selectionEnd === 'number') {
      return target.selectionEnd;
    }
    return getSelectionStart(target);
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

  const latexPreview = useMemo(
    () =>
      katex.renderToString(effective.text || '\\text{ }', {
        throwOnError: false,
        displayMode: true,
      }),
    [effective.text],
  );

  const withFocusMeta = (): FieldValue => {
    if (effective.meta.firstFocusAt !== undefined) {
      return effective;
    }
    return {
      ...effective,
      meta: {
        ...effective.meta,
        firstFocusAt: Date.now(),
      },
    };
  };

  const handleFocus = () => {
    focusStartedAt.current = Date.now();
    if (effective.meta.firstFocusAt !== undefined) {
      return;
    }
    onChange(withFocusMeta());
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

  const isLikelyLatex = (text: string): boolean => text.includes('\\') && /\{[^}]+\}/.test(text);

  const insertAtRange = (text: string, insert: string, start: number, end: number) => {
    const safeStart = Math.max(0, Math.min(start, text.length));
    const safeEnd = Math.max(safeStart, Math.min(end, text.length));
    return {
      text: `${text.slice(0, safeStart)}${insert}${text.slice(safeEnd)}`,
      caret: safeStart + insert.length,
      offset: safeStart,
    };
  };

  const commitInsertedText = (previous: FieldValue, nextText: string, caret: number, inputType: string, data: string) => {
    const next = markFieldActivity(previous, { value: nextText, selectionStart: caret }, { inputType, data, isComposing: false });
    onChange(next);
  };

  const insertIntoLatexInput = (insert: string, inputType = 'insertText') => {
    const target = latexInputRef.current;
    if (!target) {
      return;
    }
    const sourceText = target.value ?? effective.text;
    const inserted = insertAtRange(sourceText, insert, target.selectionStart ?? sourceText.length, target.selectionEnd ?? sourceText.length);
    target.value = inserted.text;
    target.selectionStart = inserted.caret;
    target.selectionEnd = inserted.caret;
    commitInsertedText({ ...effective, text: sourceText }, inserted.text, inserted.caret, inputType, insert);
  };

  const insertIntoMathInput = (insert: string, inputType = 'insertText') => {
    const target = mathFieldRef.current;
    if (!target) {
      return;
    }
    const sourceText = target.value ?? effective.text;
    const start = getSelectionStart(target);
    const end = getSelectionEnd(target);
    target.executeCommand?.(['insert', insert]);
    const afterCommand = target.value ?? sourceText;
    const inserted =
      afterCommand !== sourceText ? { text: afterCommand, caret: getSelectionStart(target), offset: start } : insertAtRange(sourceText, insert, start, end);
    if (afterCommand === sourceText) {
      target.value = inserted.text;
      target.selectionStart = inserted.caret;
      target.selectionEnd = inserted.caret;
    }
    ignoreNextInputValue.current = inserted.text;
    commitInsertedText({ ...effective, text: sourceText }, inserted.text, inserted.caret, inputType, insert);
  };

  const handlePaste = (event: ClipboardEvent<MathFieldElement | HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text');
    if (!isLikelyLatex(pastedText)) {
      return;
    }
    event.preventDefault();
    if (mode === 'latex') {
      insertIntoLatexInput(pastedText, 'insertFromPaste');
      return;
    }
    insertIntoMathInput(pastedText, 'insertFromPaste');
  };

  const insertSymbol = (latex: string) => {
    if (mode === 'latex') {
      insertIntoLatexInput(latex);
      return;
    }
    insertIntoMathInput(latex);
  };

  const focusActiveInput = () => {
    if (mode === 'latex') {
      latexInputRef.current?.focus();
      return;
    }
    mathFieldRef.current?.focus();
  };

  const handleCopyLatex = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(effective.text);
  };

  if (!isReady) {
    return <Field id={id} label={label} value={value} multiline rows={4} onChange={onChange} />;
  }

  return (
    <div className="field equation-editor">
      <div className="equation-editor-toolbar">
        <span className="field-label">{label}</span>
        <button type="button" className="equation-editor-toggle" onClick={() => setMode((previous) => (previous === 'math' ? 'latex' : 'math'))}>
          {mode === 'math' ? 'View as LaTeX' : 'View as math'}
        </button>
      </div>
      <EquationSymbolPalette onInsert={insertSymbol} onRestoreFocus={focusActiveInput} />
      <div className="equation-editor-body">
        {mode === 'math'
          ? createElement('math-field', {
              id,
              ref: (element: MathFieldElement | null): void => {
                mathFieldRef.current = element;
              },
              onFocus: handleFocus,
              onBlur: handleBlur,
              onPaste: handlePaste,
              onKeyDown: (event: KeyboardEvent<MathFieldElement>) => {
                if (event.key !== 'Enter' || event.shiftKey) {
                  return;
                }
                event.preventDefault();
                const target = event.currentTarget;
                const previousText = target.value ?? effective.text;
                if (!previousText.includes('\\begin{gathered}')) {
                  const wrapped = `\\begin{gathered}${previousText} \\\\ \\end{gathered}`;
                  const caret = wrapped.lastIndexOf('\\end{gathered}');
                  target.value = wrapped;
                  target.selectionStart = caret;
                  target.selectionEnd = caret;
                } else {
                  target.executeCommand?.(['addRowAfter']);
                }
                const nextText = target.value ?? previousText;
                const caret = getSelectionStart(target);
                ignoreNextInputValue.current = nextText;
                commitInsertedText({ ...effective, text: previousText }, nextText, caret, 'insertText', '\\\\');
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
                if (ignoreNextInputValue.current !== null && ignoreNextInputValue.current === targetValue) {
                  ignoreNextInputValue.current = null;
                  return;
                }
                const next = markFieldActivity(
                  effective,
                  { value: targetValue, selectionStart: getSelectionStart(target) },
                  { inputType: native.inputType, data: native.data, isComposing: native.isComposing },
                );
                onChange(next);
              },
            })
          : (
            <textarea
              id={id}
              ref={latexInputRef}
              rows={4}
              value={effective.text}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onPaste={handlePaste}
              onCompositionStart={(event) => {
                composition.current = {
                  startOffset: event.currentTarget.selectionStart ?? effective.text.length,
                  startText: effective.text,
                };
              }}
              onCompositionEnd={(event) => {
                const snapshot = composition.current;
                composition.current = null;
                if (!snapshot) {
                  return;
                }
                const target = event.currentTarget;
                const base = markFieldActivity(effective, { value: target.value, selectionStart: target.selectionStart }, {});
                const composedText = getComposedSubstring(snapshot.startText, target.value, snapshot.startOffset);
                onChange(appendPasteEvent(base, 'ime', composedText, snapshot.startOffset));
              }}
              onInput={(event) => {
                const target = event.currentTarget;
                const native = event.nativeEvent as InputEvent;
                const next = markFieldActivity(
                  effective,
                  { value: target.value, selectionStart: target.selectionStart },
                  { inputType: native.inputType, data: native.data, isComposing: native.isComposing },
                );
                onChange(next);
              }}
            />
            )}
        <div className="equation-editor-preview">
          {mode === 'math' ? (
            <>
              <div className="equation-editor-preview-header">
                <strong>LaTeX source</strong>
                <button type="button" onClick={() => void handleCopyLatex()}>
                  Copy LaTeX
                </button>
              </div>
              <pre>{effective.text}</pre>
            </>
          ) : (
            <div className="equation-editor-katex" dangerouslySetInnerHTML={{ __html: latexPreview }} />
          )}
        </div>
      </div>
    </div>
  );
}
