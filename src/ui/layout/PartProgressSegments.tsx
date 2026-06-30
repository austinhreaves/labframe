import { useMemo } from 'react';

import type { Part, Section } from '@/domain/schema';
import { isCountedSection, sectionHasText } from '@/state/answered';
import { useLabStore, type LabStoreState } from '@/state/labStore';

type Props = {
  parts: Part[];
  sections: Section[];
  /** First index of the review tail; sections at or after this are not in a part. */
  reviewTailStart: number;
  /** Active part key, or 'review', for highlighting the current segment. */
  activeKey: string | null;
  onNavigate: (key: string) => void;
};

type FillState = 'all' | 'some' | 'none';

/** Three-state fill over a slice's answerable sections (Pass 4 segment logic). */
function fillStateFor(slice: Section[], store: LabStoreState): FillState {
  const counted = slice.filter(isCountedSection);
  if (counted.length === 0) {
    return 'none';
  }
  const answered = counted.filter((section) => sectionHasText(section, store)).length;
  if (answered === counted.length) {
    return 'all';
  }
  return answered > 0 ? 'some' : 'none';
}

/**
 * Pass 4: one progress segment per part (filled when every answerable section in
 * the part is answered, half-tone when some are, faint when none), plus a final
 * "Review" segment when the review tail carries answerable questions so a student
 * sees that work remains after the last part. Clicking a segment navigates to it.
 */
export function PartProgressSegments({
  parts,
  sections,
  reviewTailStart,
  activeKey,
  onNavigate,
}: Props) {
  const hasReviewTail = useMemo(
    () => sections.slice(reviewTailStart).filter(isCountedSection).length > 0,
    [sections, reviewTailStart],
  );

  // Return a primitive (joined string) so the selector keeps referential
  // stability across keystrokes that do not change any segment's state.
  const statesString = useLabStore((store) => {
    const states = parts.map((part) =>
      fillStateFor(sections.slice(part.sectionRange[0], part.sectionRange[1]), store),
    );
    if (hasReviewTail) {
      states.push(fillStateFor(sections.slice(reviewTailStart), store));
    }
    return states.join(',');
  });
  const states = statesString.split(',') as FillState[];

  const segments = parts.map((part, index) => ({
    key: part.key,
    label: `Part ${part.key}`,
    state: states[index] ?? 'none',
  }));
  if (hasReviewTail) {
    segments.push({ key: 'review', label: 'Review', state: states[parts.length] ?? 'none' });
  }

  return (
    <div className="part-segments" role="group" aria-label="Part progress">
      {segments.map((segment) => (
        <button
          key={segment.key}
          type="button"
          className="part-segment"
          data-state={segment.state}
          aria-current={activeKey === segment.key ? 'step' : undefined}
          aria-label={`${segment.label} (${segment.state === 'all' ? 'all answered' : segment.state === 'some' ? 'some answered' : 'none answered'})`}
          title={segment.label}
          onClick={() => onNavigate(segment.key)}
        />
      ))}
    </div>
  );
}
