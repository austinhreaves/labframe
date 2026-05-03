import { lazy } from 'react';
import type { InstructionsSection } from '@/domain/schema';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
const MarkdownBlock = lazy(() => import('@/ui/primitives/MarkdownBlock'));

type Props = {
  section: InstructionsSection;
};

export function InstructionsSectionView({ section }: Props) {
  return (
    <section className="section section-instructions">
      <SectionPointsCaption points={section.points} />
      <MarkdownBlock markdown={section.html} />
    </section>
  );
}
