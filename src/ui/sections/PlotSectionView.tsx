import type { PlotSection, TableData } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Chart } from '@/ui/primitives/Chart';

const EMPTY_TABLE: TableData = [];

type Props = {
  section: PlotSection;
};

export function PlotSectionView({ section }: Props) {
  const data = useLabStore((state) => state.tables[section.sourceTableId] ?? EMPTY_TABLE);
  const selectedFitId = useLabStore((state) => state.selectedFits[section.plotId] ?? null);
  const setSelectedFit = useLabStore((state) => state.setSelectedFit);
  const fitOptions = section.fits ?? [];

  return (
    <section className="section">
      {fitOptions.length > 0 ? (
        <label>
          Fit model:
          <select
            value={selectedFitId ?? ''}
            onChange={(event) => setSelectedFit(section.plotId, event.currentTarget.value || null)}
          >
            <option value="">No fit</option>
            {fitOptions.map((fit) => (
              <option key={fit.id} value={fit.id}>
                {fit.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Chart section={section} data={data} />
    </section>
  );
}
