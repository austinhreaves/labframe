import type { Section } from '@/domain/schema';
import { mathToInline } from '@/services/pdf/markdown/latexToUnicode';

/** Human-readable section headings, replacing the raw schema `kind` strings.
 *  Shared by the PDF body and the Process Record so both read identically. */
export const SECTION_TITLES: Record<Section['kind'], string> = {
  instructions: 'Instructions',
  objective: 'Objective',
  measurement: 'Measurement',
  multiMeasurement: 'Measurements',
  dataTable: 'Data Table',
  plot: 'Plot',
  image: 'Image',
  calculation: 'Calculation',
  concept: 'Response',
};

/**
 * A human title for a single section, used by the body headers and the
 * compacted "Unanswered sections" / "No recorded activity" lists. Measurement
 * and plot titles carry their own labels (run through the inline math
 * converter); everything else falls back to the kind map.
 */
export function sectionTitle(section: Section): string {
  if (section.kind === 'measurement') {
    return mathToInline(section.label);
  }
  if (section.kind === 'plot') {
    return mathToInline(section.title ?? `${section.yLabel} vs. ${section.xLabel}`);
  }
  return SECTION_TITLES[section.kind];
}
