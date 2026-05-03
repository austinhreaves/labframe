import type { Section } from '@/domain/schema';

/** Integer vs decimal display for section points (UI captions, PDF titles, cover total). */
export function formatPointsLabel(n: number): string {
  if (Number.isInteger(n)) {
    return String(n);
  }
  return String(n);
}

/** Sums `points` across sections where defined (undefined contributes 0). */
export function sumSectionPoints(sections: readonly Section[]): number {
  return sections.reduce((sum, section) => {
    const p = section.points;
    return sum + (typeof p === 'number' ? p : 0);
  }, 0);
}
