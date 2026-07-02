import { describe, expect, it } from 'vitest';

import { formatFitLabel, type XYPoint } from '@/services/math/leastSquares';
import { powerTransferFit } from '@/services/math/powerTransferFit';

/**
 * Reference values for the noisy dataset were produced with an independent
 * implementation of the same algorithm (closed-form sqrt(R/P) seed + damped
 * Gauss-Newton on P-space residuals) and confirmed to be the true
 * least-squares minimum by fine grid search around the converged point.
 */

/** The lab's 15 prescribed load-resistance values. */
const LAB_R_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 20, 40];

function cleanModel(a: number, b: number): XYPoint[] {
  return LAB_R_VALUES.map((x) => ({ x, y: (a * x) / ((x + b) * (x + b)) }));
}

describe('powerTransferFit', () => {
  it('recovers A and B exactly on clean synthetic data (A=36, B=3)', () => {
    const result = powerTransferFit(cleanModel(36, 3));
    expect(result).not.toBeNull();
    expect(result?.slope).toBeCloseTo(36, 6);
    expect(result?.intercept).toBeCloseTo(3, 8);
    expect(result?.slopeStdErr).toBeCloseTo(0, 6);
    expect(result?.interceptStdErr).toBeCloseTo(0, 6);
    expect(result?.rSquared).toBeCloseTo(1, 10);
  });

  it('matches the verified reference fit on noisy data', () => {
    const noise = [
      0.012, -0.008, 0.015, -0.011, 0.006, 0.009, -0.014, 0.004, -0.006, 0.011, -0.009, 0.007,
      -0.012, 0.005, -0.003,
    ];
    const points: XYPoint[] = LAB_R_VALUES.map((x, i) => ({
      x,
      y: (36 * x) / ((x + 3) * (x + 3)) + noise[i]!,
    }));

    const result = powerTransferFit(points);
    expect(result).not.toBeNull();
    expect(result?.slope).toBeCloseTo(35.92874399423, 6);
    expect(result?.slopeStdErr).toBeCloseTo(0.11210737925686, 8);
    expect(result?.intercept).toBeCloseTo(2.99271960689, 8);
    expect(result?.interceptStdErr).toBeCloseTo(0.00997081338031, 8);
    expect(result?.rSquared).toBeCloseTo(0.99977261579642, 10);
  });

  it('returns null for empty, one-point, and two-point datasets', () => {
    const clean = cleanModel(36, 3);
    expect(powerTransferFit([])).toBeNull();
    expect(powerTransferFit(clean.slice(0, 1))).toBeNull();
    expect(powerTransferFit(clean.slice(0, 2))).toBeNull();
  });

  it('returns null for all-NaN input without throwing', () => {
    const points: XYPoint[] = [
      { x: Number.NaN, y: Number.NaN },
      { x: Number.NaN, y: Number.NaN },
      { x: Number.NaN, y: Number.NaN },
      { x: Number.NaN, y: Number.NaN },
    ];
    expect(powerTransferFit(points)).toBeNull();
  });

  it('skips out-of-domain rows (x = 0, y <= 0) and still recovers the model', () => {
    const points: XYPoint[] = [{ x: 0, y: 1.5 }, { x: 4, y: -0.25 }, ...cleanModel(36, 3)];
    const result = powerTransferFit(points);
    expect(result).not.toBeNull();
    expect(result?.slope).toBeCloseTo(36, 6);
    expect(result?.intercept).toBeCloseTo(3, 8);
  });

  it('returns null when every point sits at the same resistance (sxx = 0)', () => {
    const points: XYPoint[] = [
      { x: 5, y: 2.8 },
      { x: 5, y: 2.9 },
      { x: 5, y: 3.0 },
    ];
    expect(powerTransferFit(points)).toBeNull();
  });

  it('formats the fit label with A/B symbols and 1σ uncertainties', () => {
    const fit = { id: 'powerTransfer', label: 'Power transfer (P = A·R/(R + B)²)' } as const;
    const result = powerTransferFit(cleanModel(36, 3));
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }
    const label = formatFitLabel(fit, result);
    expect(label).toContain('Power transfer');
    expect(label).toContain('A = ');
    expect(label).toContain('B = ');
    expect(label).toContain('(1σ)');
    expect(label).toContain('R^2 = ');
    expect(label).not.toContain('m = ');
  });
});
