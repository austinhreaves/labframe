import { lazy } from 'react';
import type { MultiMeasurementSection } from '@/domain/schema';
import { hasText } from '@/state/answered';
import { useLabStore } from '@/state/labStore';
import { AnswerCard } from '@/ui/sections/AnswerCard';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const MarkdownInline = lazy(() => import('@/ui/primitives/MarkdownInline'));

type Props = {
  section: MultiMeasurementSection;
};

export function MultiMeasurementSectionView({ section }: Props) {
  const fields = useLabStore((state) => state.fields);
  const setField = useLabStore((state) => state.setField);
  const answered = section.rows.some((row) => hasText(fields[row.id]?.text));

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <AnswerCard answered={answered} hideEyebrow>
        {section.rows.map((row) => {
          const label = row.unit ? `${row.label} (${row.unit})` : row.label;
          const labelDisplay = (
            <>
              <MarkdownInline markdown={row.label} />
              {row.unit ? ` (${row.unit})` : null}
            </>
          );
          return (
            <Field
              key={row.id}
              id={row.id}
              label={label}
              labelDisplay={labelDisplay}
              value={fields[row.id]}
              onChange={(next) => setField(row.id, next)}
            />
          );
        })}
      </AnswerCard>
    </section>
  );
}
