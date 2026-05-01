import { describe, expect, it } from 'vitest';

import {
  formatFitLabel,
  linearLeastSquares,
  proportionalLeastSquares,
  type FitResult,
  type XYPoint,
} from '@/services/math/leastSquares';

describe('leastSquares', () => {
  describe('proportionalLeastSquares', () => {
    it('fits clean y = 2x data with near-zero uncertainty', () => {
      const points: XYPoint[] = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
      ];

      const result = proportionalLeastSquares(points);
      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(2, 12);
      expect(result?.slopeStdErr).toBeCloseTo(0, 12);
      expect(result?.intercept).toBeUndefined();
      expect(result?.interceptStdErr).toBeUndefined();
      expect(result?.rSquared).toBeCloseTo(1, 12);
    });

    it('returns null for empty and single-point datasets', () => {
      expect(proportionalLeastSquares([])).toBeNull();
      expect(proportionalLeastSquares([{ x: 1, y: 2 }])).toBeNull();
    });

    it('returns null when sum of x squared is zero', () => {
      const points: XYPoint[] = [
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ];
      expect(proportionalLeastSquares(points)).toBeNull();
    });

    it('matches hard-coded noisy reference values', () => {
      const points: XYPoint[] = [
        { x: 1, y: 2.1 },
        { x: 2, y: 3.9 },
        { x: 3, y: 6.2 },
        { x: 4, y: 7.8 },
      ];
      const result = proportionalLeastSquares(points);
      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(1.99, 8);
      expect(result?.slopeStdErr).toBeCloseTo(0.032829526, 8);
      expect(result?.rSquared).toBeCloseTo(0.9991841884, 8);
      expect(result?.intercept).toBeUndefined();
      expect(result?.interceptStdErr).toBeUndefined();
    });
  });

  describe('linearLeastSquares', () => {
    it('fits clean y = 2x + 1 data with near-zero uncertainty', () => {
      const points: XYPoint[] = [
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
      ];

      const result = linearLeastSquares(points);
      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(2, 12);
      expect(result?.intercept).toBeCloseTo(1, 12);
      expect(result?.slopeStdErr).toBeCloseTo(0, 12);
      expect(result?.interceptStdErr).toBeCloseTo(0, 12);
      expect(result?.rSquared).toBeCloseTo(1, 12);
    });

    it('returns exact values for two points and NaN uncertainty', () => {
      const points: XYPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
      ];

      const result = linearLeastSquares(points);
      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(2, 12);
      expect(result?.intercept).toBeCloseTo(0, 12);
      expect(Number.isFinite(result?.slope ?? Number.NaN)).toBe(true);
      expect(Number.isFinite(result?.intercept ?? Number.NaN)).toBe(true);
      expect(Number.isNaN(result?.slopeStdErr ?? 0)).toBe(true);
      expect(Number.isNaN(result?.interceptStdErr ?? 0)).toBe(true);
      expect(result?.rSquared).toBeCloseTo(1, 12);
    });

    it('returns null for degenerate inputs', () => {
      expect(linearLeastSquares([])).toBeNull();
      expect(linearLeastSquares([{ x: 1, y: 2 }])).toBeNull();
      expect(
        linearLeastSquares([
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ]),
      ).toBeNull();
    });

    it('matches hard-coded noisy reference values', () => {
      const points: XYPoint[] = [
        { x: 1, y: 2.1 },
        { x: 2, y: 3.9 },
        { x: 3, y: 6.2 },
        { x: 4, y: 7.8 },
      ];

      const result = linearLeastSquares(points);
      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(1.94, 8);
      expect(result?.intercept).toBeCloseTo(0.15, 8);
      expect(result?.slopeStdErr).toBeCloseTo(0.0905538514, 8);
      expect(result?.interceptStdErr).toBeCloseTo(0.2479919354, 8);
      expect(result?.rSquared).toBeCloseTo(0.9956613757, 8);
    });
  });

  describe('formatFitLabel', () => {
    it('formats linear fit labels with 1σ slope and intercept terms', () => {
      const fit = { id: 'linear', label: 'Linear Fit' };
      const result: FitResult = {
        slope: 2,
        slopeStdErr: 0.01,
        intercept: 1,
        interceptStdErr: 0.02,
        rSquared: 0.999,
      };

      const label = formatFitLabel(fit, result);
      expect(label).toContain('Linear Fit:');
      expect(label).toContain('m = ');
      expect(label).toContain('±');
      expect(label).toContain('(1σ)');
      expect(label).toContain('b = ');
      expect(label).toContain('R^2 = ');
    });

    it('formats proportional labels with forced intercept text', () => {
      const fit = { id: 'proportional', label: 'Proportional Fit' };
      const result: FitResult = {
        slope: 2,
        slopeStdErr: 0.01,
        rSquared: 0.999,
      };

      const label = formatFitLabel(fit, result);
      expect(label).toContain('Proportional Fit:');
      expect(label).toContain('m = ');
      expect(label).toContain('(1σ)');
      expect(label).toContain('b ≡ 0 (no intercept term)');
      expect(label).not.toContain('sigma_b');
      expect(label).toContain('R^2 = ');
    });

    it('renders insufficient-data uncertainty labels for NaN standard errors', () => {
      const fit = { id: 'linear', label: 'Linear Fit' };
      const result: FitResult = {
        slope: 2,
        slopeStdErr: Number.NaN,
        intercept: 1,
        interceptStdErr: Number.NaN,
        rSquared: 1,
      };

      const label = formatFitLabel(fit, result);
      expect(label).toContain('m = 2.000 (insufficient data)');
      expect(label).toContain('b = 1.000 (insufficient data)');
      expect(label).not.toContain('± NaN');
    });
  });
});
