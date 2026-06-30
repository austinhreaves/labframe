import type { Section, TableRow } from '@/domain/schema';
import type { LabStoreState } from '@/state/labStore';

/** True when a stored string holds non-whitespace content. */
export function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * Sections that carry a gradable answer of their own. `instructions` is teaching
 * and `plot` derives from a data table, so neither contributes an answer; both
 * are excluded from per-part and progress counts. Keep this aligned with the
 * status tag (Pass 1), the part-progress segments (Pass 4), and the sticky-header
 * count (Pass 3) so they all agree.
 */
export function isCountedSection(section: Section): boolean {
  return section.kind !== 'instructions' && section.kind !== 'plot';
}

export function rowHasText(row: TableRow | undefined): boolean {
  if (!row) {
    return false;
  }
  return Object.values(row).some((cell) => hasText(cell.text));
}

/** Whether a single section has been answered, given the current store state. */
export function sectionHasText(section: Section, state: LabStoreState): boolean {
  if (
    section.kind === 'objective' ||
    section.kind === 'measurement' ||
    section.kind === 'calculation' ||
    section.kind === 'concept'
  ) {
    return hasText(state.fields[section.fieldId]?.text);
  }
  if (section.kind === 'multiMeasurement') {
    return section.rows.some((row) => hasText(state.fields[row.id]?.text));
  }
  if (section.kind === 'image') {
    return hasText(state.fields[section.captionFieldId]?.text);
  }
  if (section.kind === 'dataTable') {
    return (state.tables[section.tableId] ?? []).some((row) => rowHasText(row));
  }
  return false;
}
