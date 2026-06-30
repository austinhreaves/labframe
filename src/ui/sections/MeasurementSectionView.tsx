import { lazy } from 'react';
import type { MeasurementSection } from '@/domain/schema';
import { hasText } from '@/state/answered';
import { useLabStore } from '@/state/labStore';
import { AnswerCard } from '@/ui/sections/AnswerCard';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const MarkdownInline = lazy(() => import('@/ui/primitives/MarkdownInline'));

type Props = {
  section: MeasurementSection;
};

export function MeasurementSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  const label = section.unit ? `${section.label} (${section.unit})` : section.label;
  const labelDisplay = (
    <>
      <MarkdownInline markdown={section.label} />
      {section.unit ? ` (${section.unit})` : null}
    </>
  );

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <AnswerCard answered={hasText(value?.text)} hideEyebrow>
        <Field
          id={section.fieldId}
          label={label}
          labelDisplay={labelDisplay}
          value={value}
          onChange={(next) => setField(section.fieldId, next)}
        />
      </AnswerCard>
    </section>
  );
}
