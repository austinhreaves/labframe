import { lazy } from 'react';
import type { ConceptSection } from '@/domain/schema';
import { hasText } from '@/state/answered';
import { useLabStore } from '@/state/labStore';
import { AnswerCard } from '@/ui/sections/AnswerCard';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const MarkdownBlock = lazy(() => import('@/ui/primitives/MarkdownBlock'));

type Props = {
  section: ConceptSection;
};

export function ConceptSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      {section.preamble ? <MarkdownBlock markdown={section.preamble} /> : null}
      <MarkdownBlock markdown={section.prompt} />
      <AnswerCard answered={hasText(value?.text)}>
        <Field
          id={section.fieldId}
          label={section.prompt}
          hideLabel
          value={value}
          multiline
          rows={section.rows ?? 3}
          onChange={(next) => setField(section.fieldId, next)}
        />
      </AnswerCard>
    </section>
  );
}
