import { describe, expect, it } from 'vitest';

import { formatDuration } from '@/services/pdf/formatDuration';

describe('formatDuration', () => {
  it('shows seconds only under a minute', () => {
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(900)).toBe('0s');
  });

  it('zero-pads seconds once minutes appear', () => {
    expect(formatDuration(125_000)).toBe('2m 05s');
    expect(formatDuration(60_000)).toBe('1m 00s');
  });

  it('zero-pads minutes and seconds once hours appear', () => {
    // 1h 03m 12s = 3792 seconds.
    expect(formatDuration(3_792_000)).toBe('1h 03m 12s');
    expect(formatDuration(3_600_000)).toBe('1h 00m 00s');
  });

  it('floors fractional seconds and clamps negatives to zero', () => {
    expect(formatDuration(45_999)).toBe('45s');
    expect(formatDuration(-5_000)).toBe('0s');
  });
});
