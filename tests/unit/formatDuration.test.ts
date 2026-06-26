import { describe, expect, it } from 'vitest';

import { formatDuration } from '@/services/pdf/formatDuration';

describe('formatDuration', () => {
  it('shows bare seconds under a minute', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(59_999)).toBe('59s');
  });

  it('zero-pads seconds once minutes are present', () => {
    expect(formatDuration(60_000)).toBe('1m 00s');
    expect(formatDuration(125_000)).toBe('2m 05s');
    expect(formatDuration(3_599_000)).toBe('59m 59s');
  });

  it('zero-pads minutes and seconds once hours are present', () => {
    expect(formatDuration(3_600_000)).toBe('1h 00m 00s');
    expect(formatDuration(3_792_000)).toBe('1h 03m 12s');
  });

  it('floors sub-second remainders and clamps negatives to zero', () => {
    expect(formatDuration(1_900)).toBe('1s');
    expect(formatDuration(-5_000)).toBe('0s');
  });
});
