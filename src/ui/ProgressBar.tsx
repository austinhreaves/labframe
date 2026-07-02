import { useMemo } from 'react';

import type { Section } from '@/domain/schema';
import { buildTocEntries } from '@/domain/tocEntries';
import { Progress } from '@/ui/primitives/Progress';
import { isCountedSection, sectionHasText } from '@/state/answered';
import { useLabStore, type LabStoreState } from '@/state/labStore';

type Props = {
  sections: Section[];
};

type SectionGroup = {
  /** Sections within this TOC entry's range that have a fillable input. */
  fillables: Section[];
};

/**
 * Group fillable subsections under each TOC entry. The total count is therefore
 * the same number students see in the TOC popover, and a TOC section ticks as
 * "complete" only once every fillable input below its heading has content.
 */
function buildSectionGroups(sections: Section[]): SectionGroup[] {
  const tocEntries = buildTocEntries(sections);
  const tocIndices = tocEntries.map((entry) =>
    Number.parseInt(entry.id.replace('section-', ''), 10),
  );
  return tocIndices.map((start, i) => {
    const end = i + 1 < tocIndices.length ? tocIndices[i + 1]! : sections.length;
    const fillables = sections.slice(start, end).filter(isCountedSection);
    return { fillables };
  });
}

function isGroupComplete(group: SectionGroup, state: LabStoreState): boolean {
  // A heading with no fillable subsections is treated as already complete so
  // the count stays anchored to the TOC entry count.
  if (group.fillables.length === 0) {
    return true;
  }
  return group.fillables.every((section) => sectionHasText(section, state));
}

export function ProgressBar({ sections }: Props) {
  const groups = useMemo(() => buildSectionGroups(sections), [sections]);
  const filledCount = useLabStore(
    (state) => groups.filter((group) => isGroupComplete(group, state)).length,
  );
  const totalCount = groups.length;
  const safeTotal = Math.max(totalCount, 1);
  return (
    <div className="lab-progress" aria-live="polite">
      <Progress
        value={filledCount}
        max={safeTotal}
        label={`Progress: ${filledCount}/${totalCount}`}
        size="sm"
      />
    </div>
  );
}
