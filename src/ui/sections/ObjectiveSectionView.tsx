import type { ObjectiveSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Field } from '@/ui/primitives/Field';

type Props = {
  section: ObjectiveSection;
};

export function ObjectiveSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  return (
    <section className="section">
      <Field
        id={section.fieldId}
        label="Objective"
        value={value}
        multiline
        rows={section.rows ?? 3}
        onChange={(next) => setField(section.fieldId, next)}
      />
    </section>
  );
}
