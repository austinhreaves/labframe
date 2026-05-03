import type { Section } from '@/domain/schema';

export type TocEntry = {
  id: string;
  label: string;
};

/** Major-sections-only inclusion (see REBUILD_SPEC 3.7.1). No generic fallback. */
export function buildTocEntries(sections: Section[]): TocEntry[] {
  const out: TocEntry[] = [];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (!section) {
      continue;
    }

    if (section.tocHidden) {
      continue;
    }
    if (section.tocLabel?.trim()) {
      out.push({ id: `section-${index}`, label: section.tocLabel.trim() });
      continue;
    }
    if (section.kind === 'instructions') {
      const firstLine = section.html.split('\n').find((line) => line.trim() !== '');
      const match = firstLine?.match(/^##\s+(.+)$/);
      if (match?.[1]) {
        out.push({ id: `section-${index}`, label: match[1].trim() });
      }
      continue;
    }
    if (section.kind === 'objective') {
      out.push({ id: `section-${index}`, label: 'Objective' });
    }
  }

  return out;
}
