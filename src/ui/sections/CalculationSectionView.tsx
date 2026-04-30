import type { CalculationSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { EquationEditor } from '@/ui/primitives/EquationEditor';
import { Field } from '@/ui/primitives/Field';

type Props = {
  section: CalculationSection;
};

export function CalculationSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);

  return (
    <section className="section">
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
