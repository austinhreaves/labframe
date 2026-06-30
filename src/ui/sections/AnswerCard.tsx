import type { ReactNode } from 'react';

type Props = {
  /** Whether the wrapped field holds an answer yet; drives the status tag. */
  answered: boolean;
  /**
   * Hide the "Your answer" eyebrow for fields that already carry their own
   * visible label (measurement inputs), where the eyebrow would be redundant.
   * The status tag still shows.
   */
  hideEyebrow?: boolean;
  children: ReactNode;
};

/**
 * Wraps an answerable field in the distinct answer-card chrome from Pass 1: a
 * 3px accent left rule, a faint accent fill, a "Your answer" eyebrow, and a
 * status tag that flips from "Not yet" to "Answered" as the student types. The
 * wrapped child stays the instrumented `Field` (or equation editor); the chrome
 * is purely presentational and must not replace the input.
 */
export function AnswerCard({ answered, hideEyebrow = false, children }: Props) {
  return (
    <div className="answer-card" data-answered={answered ? '' : undefined}>
      <div className="answer-card-head">
        {hideEyebrow ? null : <span className="answer-card-eyebrow">Your answer</span>}
        <span className="answer-card-status" data-answered={answered ? '' : undefined}>
          {answered ? 'Answered' : 'Not yet'}
        </span>
      </div>
      {children}
    </div>
  );
}
