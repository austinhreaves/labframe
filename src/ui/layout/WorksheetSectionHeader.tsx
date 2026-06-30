type Props = {
  labTitle: string;
  /** "Part 1A - John Travoltage", or "Finish & review" for the review step. */
  partLabel: string;
  /** Per-part answered count over the part's answerable sections; null hides it. */
  answered: number | null;
  total: number | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * Pass 3: a slim, persistent ~36px header at the top of the worksheet pane
 * showing the lab title, the active part and its simulation, the per-part
 * answered count, and the Pass 6 minimal prev/next arrows (dimmed at the ends).
 */
export function WorksheetSectionHeader({
  labTitle,
  partLabel,
  answered,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="worksheet-section-header">
      <div className="wsh-context">
        <span className="wsh-title">{labTitle}</span>
        <span className="wsh-sep" aria-hidden="true">
          /
        </span>
        <span className="wsh-part">{partLabel}</span>
      </div>
      <div className="wsh-meta">
        {answered !== null && total !== null ? (
          <span className="wsh-count" aria-live="polite">
            {answered}/{total} answered
          </span>
        ) : null}
        <div className="wsh-arrows">
          <button type="button" aria-label="Previous part" disabled={!canPrev} onClick={onPrev}>
            {'‹'}
          </button>
          <button type="button" aria-label="Next part" disabled={!canNext} onClick={onNext}>
            {'›'}
          </button>
        </div>
      </div>
    </div>
  );
}
