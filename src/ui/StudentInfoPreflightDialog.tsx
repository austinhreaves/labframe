import { useEffect, useId, useRef } from 'react';

import type { StudentInfoFieldId } from '@/services/integrity/preflight';

type Props = {
  open: boolean;
  missing: StudentInfoFieldId[];
  onClose: () => void;
};

const FIELD_LABELS: Record<StudentInfoFieldId, string> = {
  studentName: 'Student name',
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
  return Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter((el) => !el.hasAttribute('hidden'));
}

export function StudentInfoPreflightDialog({ open, missing, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    confirmRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="preflight-dialog-backdrop">
      <div
        ref={dialogRef}
        className="preflight-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }
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
        <h2 id={titleId}>Missing required information</h2>
        <p>Please fill in the following before exporting a PDF:</p>
        <ul>
          {missing.map((fieldId) => (
            <li key={fieldId}>{FIELD_LABELS[fieldId] ?? fieldId}</li>
          ))}
        </ul>
        <div className="preflight-dialog-actions">
          <button ref={confirmRef} type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
