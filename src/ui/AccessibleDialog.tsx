import { useEffect, useId, useRef, type ReactNode } from 'react';

type AccessibleDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
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

export function AccessibleDialog({ open, title, onClose, children, footer }: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
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
        <h2 id={titleId}>{title}</h2>
        <div>{children}</div>
        <div className="preflight-dialog-actions">
          {footer}
          <button ref={closeRef} type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
