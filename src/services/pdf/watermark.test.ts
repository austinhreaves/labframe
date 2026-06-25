import { describe, expect, it } from 'vitest';

import { truncateName, watermarkFontSize } from '@/services/pdf/watermark';

describe('watermarkFontSize', () => {
  it('uses the largest font for short strings', () => {
    expect(watermarkFontSize('Ada · SIGNED')).toBe(60);
  });

  it('shrinks for long strings but never below the floor', () => {
    const long = `${'Maximilian Schwarzenegger'} · SIGNED`;
    const size = watermarkFontSize(long);
    expect(size).toBeLessThan(60);
    expect(size).toBeGreaterThanOrEqual(22);
  });

  it('keeps the rotated line within the page width', () => {
    // After capping the name, the widest diagonal is ~37 chars; its estimated
    // line width must stay under the A4 page width (~595pt) so it does not wrap.
    const widest = `${truncateName('M'.repeat(50))} · SIGNED`;
    const estimatedWidth = widest.length * 0.62 * watermarkFontSize(widest);
    expect(estimatedWidth).toBeLessThan(595);
  });
});

describe('truncateName', () => {
  it('leaves short names untouched', () => {
    expect(truncateName('Ada Lovelace')).toBe('Ada Lovelace');
  });

  it('caps long names with an ellipsis', () => {
    const out = truncateName('M'.repeat(50));
    expect(out).toHaveLength(28);
    expect(out.endsWith('…')).toBe(true);
  });
});
