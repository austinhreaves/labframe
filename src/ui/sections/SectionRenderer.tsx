import type { Section } from '@/domain/schema';

import { CalculationSectionView } from '@/ui/sections/CalculationSectionView';
import { ConceptSectionView } from '@/ui/sections/ConceptSectionView';
import { DataTableSectionView } from '@/ui/sections/DataTableSectionView';
import { ImageSectionView } from '@/ui/sections/ImageSectionView';
import { InstructionsSectionView } from '@/ui/sections/InstructionsSectionView';
import { MeasurementSectionView } from '@/ui/sections/MeasurementSectionView';
import { MultiMeasurementSectionView } from '@/ui/sections/MultiMeasurementSectionView';
import { ObjectiveSectionView } from '@/ui/sections/ObjectiveSectionView';
import { PlotSectionView } from '@/ui/sections/PlotSectionView';

type Props = {
  section: Section;
};

export function SectionRenderer({ section }: Props) {
  switch (section.kind) {
    case 'instructions':
      return <InstructionsSectionView section={section} />;
    case 'objective':
      return <ObjectiveSectionView section={section} />;
    case 'measurement':
      return <MeasurementSectionView section={section} />;
    case 'multiMeasurement':
      return <MultiMeasurementSectionView section={section} />;
    case 'dataTable':
      return <DataTableSectionView section={section} />;
    case 'plot':
      return <PlotSectionView section={section} />;
    case 'image':
      return <ImageSectionView section={section} />;
    case 'calculation':
      return <CalculationSectionView section={section} />;
    case 'concept':
      return <ConceptSectionView section={section} />;
    default:
      return null;
  }
}
