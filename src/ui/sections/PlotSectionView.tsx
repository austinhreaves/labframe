import { lazy } from 'react';
import type { PlotSection, TableData } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Select } from '@/ui/primitives/Select';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
const Chart = lazy(() => import('@/ui/primitives/Chart'));

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
      <SectionPointsCaption points={section.points} />
      {fitOptions.length > 0 ? (
        <label className="plot-fit-picker">
          Fit model:
          <Select
            value={selectedFitId ?? ''}
            onChange={(next) => setSelectedFit(section.plotId, next || null)}
            options={[
              { value: '', label: 'No fit' },
              ...fitOptions.map((fit) => ({ value: fit.id, label: fit.label })),
            ]}
            size="md"
          />
        </label>
      ) : null}
      <Chart section={section} data={data} />
    </section>
  );
}
