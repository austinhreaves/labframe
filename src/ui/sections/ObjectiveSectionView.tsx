import type { ObjectiveSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';

type Props = {
  section: ObjectiveSection;
};

export function ObjectiveSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <Field
        id={section.fieldId}
        label={section.prompt ?? 'Objective'}
        value={value}
        multiline
        rows={section.rows ?? 3}
        onChange={(next) => setField(section.fieldId, next)}
      />
    </section>
  );
}
