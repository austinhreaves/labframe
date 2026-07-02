import { useEffect, useId, useRef, useState } from 'react';

import { validateStudentInfoForPdf } from '@/services/integrity/preflight';

type Props = {
  open: boolean;
  /** Called with the trimmed, validated name. Never fires with an empty or
   *  placeholder ("Student") name. */
  onSubmit: (name: string) => void;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('hidden'),
  );
}

/**
 * Blocking name gate shown on fresh lab load when no student name is known.
 *
 * The persistence key embeds the student name (`lab:course:lab:name`), so work
 * saved before a name is entered would never be filed under that student.
 * Collecting the name up front means every keystroke persists under the correct
 * key from the start. This is intentionally not dismissable (no Escape, no
 * backdrop close, no cancel): the name is a prerequisite, not an interruption.
 */
export function StudentNameGateDialog({ open, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const errorId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    const name = value.trim();
    if (!validateStudentInfoForPdf({ studentName: name }).ok) {
      setError(
        name.toLowerCase() === 'student'
          ? 'Please enter your real name, not "Student".'
          : 'Please enter your name to continue.',
      );
      inputRef.current?.focus();
      return;
    }
    onSubmit(name);
  };

  return (
    <div className="preflight-dialog-backdrop">
      <div
        ref={dialogRef}
        className="preflight-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={(event) => {
          // Intentionally no Escape-to-close: the name must be set before work
          // begins so it persists under the correct storage key.
          if (event.key !== 'Tab') {
            return;
          }
          const root = dialogRef.current;
          if (!root) {
            return;
          }
          const focusable = getFocusableElements(root);
          if (focusable.length === 0) {
            event.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!first || !last) {
            event.preventDefault();
            return;
          }
          const active = document.activeElement as HTMLElement | null;

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
            return;
          }

          if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id={titleId}>Enter your name to begin</h2>
        <p id={descId}>
          Your name is saved with your work and printed on the exported report. Enter it before you
          start so nothing is lost.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="student-name-gate-label">
            Student name
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                setValue(event.currentTarget.value);
                if (error) {
                  setError(null);
                }
              }}
              autoComplete="name"
              {...(error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {})}
            />
          </label>
          {error ? (
            <p className="student-name-gate-error" id={errorId} role="alert">
              {error}
            </p>
          ) : null}
          <div className="preflight-dialog-actions">
            <button type="submit">Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
