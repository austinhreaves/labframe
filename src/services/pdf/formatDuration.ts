/** Two-digit zero-pad for the lower duration units. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats a millisecond duration as H/M/S for the Process Record: `45s`,
 * `2m 05s`, `1h 03m 12s`. Higher zero units are omitted; once a unit appears,
 * the lower units are zero-padded to two digits. Negative or sub-second inputs
 * read as `0s`.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}
