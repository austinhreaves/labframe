// Pass 7: client-side view preferences persisted per student in localStorage,
// mirroring src/ui/theme.ts. URL search params still win when present (good for
// sharing and deep links); these stored values are the fallback for a fresh
// navigation with no param.

export type TextSize = 'S' | 'M' | 'L';
// Parallel = sim beside the worksheet (the split view); Series = sim stacked at
// the top of a single-column scroll. (Formerly 'side' / 'tabs'.)
export type LayoutMode = 'parallel' | 'series';

export const TEXT_SIZE_STORAGE_KEY = 'labframe:text-size';
export const LAYOUT_STORAGE_KEY = 'labframe:layout';

// Matches the prototype's zoomMap exactly. Default M is intentionally a touch
// under 1.0 so the worksheet prose sits comfortably beside the simulation.
const ZOOM_BY_SIZE: Record<TextSize, number> = { S: 0.88, M: 0.96, L: 1.08 };

export const TEXT_SIZES: readonly TextSize[] = ['S', 'M', 'L'];

export function getStoredTextSize(): TextSize {
  try {
    const stored =
      typeof localStorage !== 'undefined' ? localStorage.getItem(TEXT_SIZE_STORAGE_KEY) : null;
    return stored === 'S' || stored === 'L' ? stored : 'M';
  } catch {
    return 'M';
  }
}

export function storeTextSize(size: TextSize): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
    }
  } catch {
    // Ignore storage write errors (quota, private mode).
  }
}

/** The `zoom` factor for a text size, scoped to the worksheet content wrapper. */
export function textSizeZoom(size: TextSize): number {
  return ZOOM_BY_SIZE[size];
}

/** Returns the persisted layout preference, or null when none is stored. */
export function getStoredLayout(): LayoutMode | null {
  try {
    const stored =
      typeof localStorage !== 'undefined' ? localStorage.getItem(LAYOUT_STORAGE_KEY) : null;
    if (stored === 'parallel' || stored === 'series') {
      return stored;
    }
    // Migrate the pre-rename values from earlier on this branch.
    if (stored === 'side') {
      return 'parallel';
    }
    if (stored === 'tabs') {
      return 'series';
    }
    return null;
  } catch {
    return null;
  }
}

export function storeLayout(mode: LayoutMode): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
    }
  } catch {
    // Ignore storage write errors (quota, private mode).
  }
}
