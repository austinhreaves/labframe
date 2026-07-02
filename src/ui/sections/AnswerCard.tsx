import type { ReactNode } from 'react';

type Props = {
  /**
   * Hide the "Your answer" eyebrow for fields that already carry their own
   * visible label (measurement inputs), where the eyebrow would be redundant.
   */
  hideEyebrow?: boolean;
  children: ReactNode;
};

/**
 * Wraps an answerable field in the distinct answer-card chrome from Pass 1: a
 * 3px accent left rule, a faint accent fill, and a "Your answer" eyebrow. The
 * wrapped child stays the instrumented `Field` (or equation editor); the chrome
 * is purely presentational and must not replace the input. Per-field completion
 * is intentionally not signalled here (progress lives in the toolbar part dots
 * and the answered count), so there is no status tag.
 */
export function AnswerCard({ hideEyebrow = false, children }: Props) {
  return (
    <div className="answer-card">
      {hideEyebrow ? null : (
        <div className="answer-card-head">
          <span className="answer-card-eyebrow">Your answer</span>
        </div>
      )}
      {children}
    </div>
  );
}
