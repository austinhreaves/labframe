import type { MultiMeasurementSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';

type Props = {
  section: MultiMeasurementSection;
};

export function MultiMeasurementSectionView({ section }: Props) {
  const fields = useLabStore((state) => state.fields);
  const setField = useLabStore((state) => state.setField);

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      {section.rows.map((row) => {
        const label = row.unit ? `${row.label} (${row.unit})` : row.label;
        return (
          <Field
            key={row.id}
            id={row.id}
            label={label}
            value={fields[row.id]}
            onChange={(next) => setField(row.id, next)}
          />
        );
      })}
    </section>
  );
}
