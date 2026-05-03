import { Suspense, type ReactNode } from 'react';
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
import { SectionSkeleton } from '@/ui/sections/SectionSkeleton';

type Props = {
  section: Section;
};

export function SectionRenderer({ section }: Props) {
  let content: ReactNode = null;
  switch (section.kind) {
    case 'instructions':
      content = <InstructionsSectionView section={section} />;
      break;
    case 'objective':
      content = <ObjectiveSectionView section={section} />;
      break;
    case 'measurement':
      content = <MeasurementSectionView section={section} />;
      break;
    case 'multiMeasurement':
      content = <MultiMeasurementSectionView section={section} />;
      break;
    case 'dataTable':
      content = <DataTableSectionView section={section} />;
      break;
    case 'plot':
      content = <PlotSectionView section={section} />;
      break;
    case 'image':
      content = <ImageSectionView section={section} />;
      break;
    case 'calculation':
      content = <CalculationSectionView section={section} />;
      break;
    case 'concept':
      content = <ConceptSectionView section={section} />;
      break;
    default:
      content = null;
  }

  return <Suspense fallback={<SectionSkeleton />}>{content}</Suspense>;
}
