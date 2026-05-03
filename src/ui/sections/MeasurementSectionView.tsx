import type { MeasurementSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';

type Props = {
  section: MeasurementSection;
};

export function MeasurementSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  const label = section.unit ? `${section.label} (${section.unit})` : section.label;

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <Field id={section.fieldId} label={label} value={value} onChange={(next) => setField(section.fieldId, next)} />
    </section>
  );
}
