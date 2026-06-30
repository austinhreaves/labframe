import { lazy } from 'react';
import type { ObjectiveSection } from '@/domain/schema';
import { hasText } from '@/state/answered';
import { useLabStore } from '@/state/labStore';
import { AnswerCard } from '@/ui/sections/AnswerCard';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const MarkdownInline = lazy(() => import('@/ui/primitives/MarkdownInline'));

type Props = {
  section: ObjectiveSection;
};

export function ObjectiveSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  const label = section.prompt ?? 'Objective';
  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <AnswerCard answered={hasText(value?.text)} hideEyebrow>
        <Field
          id={section.fieldId}
          label={label}
          labelDisplay={section.prompt ? <MarkdownInline markdown={section.prompt} /> : 'Objective'}
          value={value}
          multiline
          rows={section.rows ?? 3}
          onChange={(next) => setField(section.fieldId, next)}
        />
      </AnswerCard>
    </section>
  );
}
