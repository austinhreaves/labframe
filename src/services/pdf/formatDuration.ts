/**
 * Format a duration in milliseconds as a compact H/M/S string for the PDF
 * Process Record (Track P, P-D). Higher zero units are omitted; lower units are
 * zero-padded once a higher unit is present.
 *
 *   45000   -> "45s"
 *   125000  -> "2m 05s"
 *   3792000 -> "1h 03m 12s"
 */
/**
 * Coarse time band for the grading PDF Process Record (SPEC 4.2). Graders get
 * a magnitude, not a stopwatch reading; granular numbers belong in the
 * inspector, not the grading surface.
 */
export function formatTimeBand(ms: number): string {
  const minutes = Math.max(0, ms) / 60_000;
  if (minutes < 1) {
    return 'under 1 min';
  }
  if (minutes < 5) {
    return '1-5 min';
  }
  if (minutes < 15) {
    return '5-15 min';
  }
  if (minutes < 45) {
    return '15-45 min';
  }
  return 'over 45 min';
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}
