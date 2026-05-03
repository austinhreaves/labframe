import { lazy } from 'react';
import type { CalculationSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const EquationEditor = lazy(() => import('@/ui/primitives/EquationEditor'));

type Props = {
  section: CalculationSection;
};

export function CalculationSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      {section.equationEditor ? (
        <EquationEditor
          id={section.fieldId}
          label={section.prompt}
          value={value}
          onChange={(next) => setField(section.fieldId, next)}
        />
      ) : (
        <Field
          id={section.fieldId}
          label={section.prompt}
          value={value}
          multiline
          rows={4}
          onChange={(next) => setField(section.fieldId, next)}
        />
      )}
    </section>
  );
}
