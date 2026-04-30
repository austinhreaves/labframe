import type { PlotSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Chart } from '@/ui/primitives/Chart';

type Props = {
  section: PlotSection;
};

export function PlotSectionView({ section }: Props) {
  const data = useLabStore((state) => state.tables[section.sourceTableId] ?? []);
  return (
    <section className="section">
      <Chart section={section} data={data} />
    </section>
  );
}
