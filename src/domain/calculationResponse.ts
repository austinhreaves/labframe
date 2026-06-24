import type { CalculationSection } from '@/domain/schema';

/** The three ways a student can answer a calculation. */
export type ResponseMode = 'text' | 'draw' | 'image';

// Storage-key suffixes keep a calculation's text, draw, and image answers from
// colliding under one fieldId, so every enabled mode coexists and switching
// modes never silently drops the work entered in another (Phase C-C).
export const DRAW_KEY_SUFFIX = '__draw';
export const IMAGE_KEY_SUFFIX = '__image';

export function drawStorageKey(fieldId: string): string {
  return `${fieldId}${DRAW_KEY_SUFFIX}`;
}

export function imageStorageKey(fieldId: string): string {
  return `${fieldId}${IMAGE_KEY_SUFFIX}`;
}

/**
 * The image id a calculation stores its photo blob under: the author-specified
 * `imageId` when present, otherwise a key derived from the fieldId so a
 * selectable section needs no explicit id.
 */
export function calcImageId(section: CalculationSection): string {
  return section.imageId ?? imageStorageKey(section.fieldId);
}

/**
 * The selectable modes for a section, or null for a single-mode section. A
 * `responseModes` array with 2+ entries governs the section (the first entry is
 * the default); a single entry or an absent array preserves author-forced
 * single-mode behavior.
 */
export function getResponseModes(section: CalculationSection): ResponseMode[] | null {
  const modes = section.responseModes;
  if (modes && modes.length >= 2) {
    return modes;
  }
  return null;
}

/**
 * The effective response mode for a calculation given the student's selection
 * map. Selectable sections honor the stored selection (defaulting to the first
 * listed mode); single-mode sections fall back to the author's `responseMode`.
 */
export function resolveResponseMode(
  section: CalculationSection,
  selections: Record<string, ResponseMode>,
): ResponseMode {
  const modes = getResponseModes(section);
  if (modes) {
    const selected = selections[section.fieldId];
    return selected && modes.includes(selected) ? selected : modes[0]!;
  }
  return section.responseMode ?? 'text';
}
