import type { FitOption } from '@/domain/schema';

export type XYPoint = {
  x: number;
  y: number;
};

export type FitResult = {
  slope: number;
  slopeStdErr: number;
  intercept?: number;
  interceptStdErr?: number;
  rSquared: number;
};

function formatValue(value: number): string {
  return value.toPrecision(4);
}

function formatTermWithUncertainty(symbol: string, value: number, stdErr: number): string {
  if (Number.isNaN(stdErr)) {
    return `${symbol} = ${formatValue(value)} (insufficient data)`;
  }
  return `${symbol} = ${formatValue(value)} ± ${formatValue(stdErr)} (1σ)`;
}

export function formatFitLabel(fit: FitOption, result: FitResult): string {
  const slopePart = formatTermWithUncertainty('m', result.slope, result.slopeStdErr);
  const interceptPart =
    result.intercept === undefined || result.interceptStdErr === undefined
      ? 'b ≡ 0 (no intercept term)'
      : formatTermWithUncertainty('b', result.intercept, result.interceptStdErr);
  const rSquaredPart = `R^2 = ${result.rSquared.toFixed(3)}`;
  return `${fit.label}: ${slopePart}, ${interceptPart}, ${rSquaredPart}`;
}

export function linearLeastSquares(points: XYPoint[]): FitResult | null {
  if (points.length < 2) {
    return null;
  }

  const n = points.length;
  const sumX = points.reduce((acc, point) => acc + point.x, 0);
  const sumY = points.reduce((acc, point) => acc + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const point of points) {
    const centeredX = point.x - meanX;
    const centeredY = point.y - meanY;
    sxx += centeredX * centeredX;
    sxy += centeredX * centeredY;
    syy += centeredY * centeredY;
  }

  if (sxx === 0) {
    return null;
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const residualSS = points.reduce((acc, point) => {
    const residual = point.y - (slope * point.x + intercept);
    return acc + residual * residual;
  }, 0);

  const slopeStdErr = n > 2 ? Math.sqrt((residualSS / (n - 2)) / sxx) : Number.NaN;
  const interceptStdErr = n > 2 ? Math.sqrt((residualSS / (n - 2)) * (1 / n + (meanX * meanX) / sxx)) : Number.NaN;
  const rSquared = syy === 0 ? 1 : 1 - residualSS / syy;

  return {
    slope,
    slopeStdErr,
    intercept,
    interceptStdErr,
    rSquared,
  };
}

export function proportionalLeastSquares(points: XYPoint[]): FitResult | null {
  if (points.length < 2) {
    return null;
  }

  const n = points.length;
  const sumXY = points.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = points.reduce((acc, point) => acc + point.x * point.x, 0);

  if (sumXX === 0) {
    return null;
  }

  const slope = sumXY / sumXX;
  const residualSS = points.reduce((acc, point) => {
    const residual = point.y - slope * point.x;
    return acc + residual * residual;
  }, 0);
  const sumYY = points.reduce((acc, point) => acc + point.y * point.y, 0);
  const slopeStdErr = Math.sqrt(residualSS / ((n - 1) * sumXX));
  // Through-origin regression convention uses uncentered R^2.
  const rSquared = sumYY === 0 ? 1 : 1 - residualSS / sumYY;

  return { slope, slopeStdErr, rSquared };
}
