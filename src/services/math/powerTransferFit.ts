import type { FitResult, XYPoint } from './leastSquares';

/**
 * Nonlinear least-squares fit of the maximum-power-transfer model
 *
 *   P(R) = A * R / (R + B)^2
 *
 * where A = EMF^2 (V^2) and B = the source's internal resistance (Ohm).
 * Used by the Kirchhoff's Laws & Power lab (load power vs. load resistance).
 *
 * The fit minimizes residuals in the original (R, P) coordinates: a closed-form
 * seed comes from the exact rearrangement sqrt(R/P) = (1/eps) * R + r/eps
 * (linear least squares on u = sqrt(x/y) vs. x), then a damped Gauss-Newton
 * iteration refines A and B against P-space residuals. Parameter standard
 * errors are 1-sigma values from the covariance matrix s^2 * (J^T J)^-1 at
 * convergence; R^2 is the centered coefficient of determination in P-space.
 *
 * Rows outside the model's domain (x <= 0 or y <= 0, where sqrt(R/P) is
 * undefined) and rows with non-finite values are skipped. This mirrors the
 * spec's linearization edge-case policy (GRAPHING_EXPANSION_SPEC.md); the fit
 * is a teaching tool and the sim never produces such rows in practice.
 *
 * Returns null when no trustworthy fit exists: fewer than 3 usable points
 * (s^2 = SSR/(n-2) needs n > 2), degenerate geometry (all points at one R), a
 * seed outside the feasible region (R + B must stay positive at every point),
 * or any non-finite result. Callers persist the parameters into the signed
 * answer envelope, whose canonicalization rejects non-finite numbers, so this
 * function must never return them.
 */

const MAX_ITERATIONS = 100;
const MAX_STEP_HALVINGS = 30;
const RELATIVE_SSR_TOLERANCE = 1e-14;

type ModelParams = { a: number; b: number };

function sumSquaredResiduals(points: XYPoint[], { a, b }: ModelParams): number {
  let ssr = 0;
  for (const point of points) {
    const denom = point.x + b;
    const residual = point.y - (a * point.x) / (denom * denom);
    ssr += residual * residual;
  }
  return ssr;
}

/** Closed-form seed from the exact linearization sqrt(x/y) = (1/sqrt(a)) x + b/sqrt(a). */
function seedFromLinearization(points: XYPoint[]): ModelParams | null {
  const n = points.length;
  let sumX = 0;
  let sumU = 0;
  for (const point of points) {
    sumX += point.x;
    sumU += Math.sqrt(point.x / point.y);
  }
  const meanX = sumX / n;
  const meanU = sumU / n;

  let sxx = 0;
  let sxu = 0;
  for (const point of points) {
    const centeredX = point.x - meanX;
    const centeredU = Math.sqrt(point.x / point.y) - meanU;
    sxx += centeredX * centeredX;
    sxu += centeredX * centeredU;
  }
  if (sxx === 0) {
    return null;
  }

  const m = sxu / sxx;
  const c = meanU - m * meanX;
  if (!(m > 0)) {
    // A negative or zero linearized slope means the data does not have the
    // model's shape at all; there is no meaningful seed.
    return null;
  }
  const a = 1 / (m * m);
  const b = c / m;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  return { a, b };
}

export function powerTransferFit(points: XYPoint[]): FitResult | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x > 0 && point.y > 0,
  );
  const n = usable.length;
  if (n < 3) {
    return null;
  }

  const minX = usable.reduce((acc, point) => Math.min(acc, point.x), Number.POSITIVE_INFINITY);

  const seed = seedFromLinearization(usable);
  if (!seed || minX + seed.b <= 0) {
    return null;
  }

  // Damped Gauss-Newton on P-space residuals.
  let { a, b } = seed;
  let ssr = sumSquaredResiduals(usable, { a, b });
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    // Accumulate the 2x2 normal equations J^T J and the gradient term J^T res.
    let jaa = 0;
    let jab = 0;
    let jbb = 0;
    let ga = 0;
    let gb = 0;
    for (const point of usable) {
      const denom = point.x + b;
      const dA = point.x / (denom * denom);
      const dB = (-2 * a * point.x) / (denom * denom * denom);
      const residual = point.y - (a * point.x) / (denom * denom);
      jaa += dA * dA;
      jab += dA * dB;
      jbb += dB * dB;
      ga += dA * residual;
      gb += dB * residual;
    }
    const det = jaa * jbb - jab * jab;
    if (!(det > 0) || !Number.isFinite(det)) {
      return null;
    }
    const stepA = (jbb * ga - jab * gb) / det;
    const stepB = (jaa * gb - jab * ga) / det;

    // Line search: full step, then halve until SSR does not increase and the
    // model stays defined (x + b > 0) at every point.
    let accepted = false;
    let damping = 1;
    let nextA = a;
    let nextB = b;
    let nextSsr = ssr;
    for (let halving = 0; halving <= MAX_STEP_HALVINGS; halving += 1) {
      const candidateA = a + damping * stepA;
      const candidateB = b + damping * stepB;
      if (minX + candidateB > 0) {
        const candidateSsr = sumSquaredResiduals(usable, { a: candidateA, b: candidateB });
        if (candidateSsr <= ssr && Number.isFinite(candidateSsr)) {
          nextA = candidateA;
          nextB = candidateB;
          nextSsr = candidateSsr;
          accepted = true;
          break;
        }
      }
      damping /= 2;
    }
    if (!accepted) {
      // No downhill step exists: the current point is the numerical minimum.
      break;
    }

    const improvement = ssr - nextSsr;
    a = nextA;
    b = nextB;
    ssr = nextSsr;
    if (improvement <= RELATIVE_SSR_TOLERANCE * (ssr + Number.MIN_VALUE)) {
      break;
    }
  }

  // 1-sigma parameter errors from the covariance matrix s^2 * (J^T J)^-1 at
  // the converged parameters.
  let jaa = 0;
  let jab = 0;
  let jbb = 0;
  for (const point of usable) {
    const denom = point.x + b;
    const dA = point.x / (denom * denom);
    const dB = (-2 * a * point.x) / (denom * denom * denom);
    jaa += dA * dA;
    jab += dA * dB;
    jbb += dB * dB;
  }
  const det = jaa * jbb - jab * jab;
  if (!(det > 0) || !Number.isFinite(det)) {
    return null;
  }
  const s2 = ssr / (n - 2);
  const slopeStdErr = Math.sqrt((jbb / det) * s2);
  const interceptStdErr = Math.sqrt((jaa / det) * s2);

  const meanY = usable.reduce((acc, point) => acc + point.y, 0) / n;
  const sstot = usable.reduce((acc, point) => {
    const centered = point.y - meanY;
    return acc + centered * centered;
  }, 0);
  const rSquared = sstot === 0 ? 1 : 1 - ssr / sstot;

  const result: FitResult = {
    slope: a,
    slopeStdErr,
    intercept: b,
    interceptStdErr,
    rSquared,
  };
  const allFinite =
    Number.isFinite(result.slope) &&
    Number.isFinite(result.slopeStdErr) &&
    Number.isFinite(result.intercept ?? Number.NaN) &&
    Number.isFinite(result.interceptStdErr ?? Number.NaN) &&
    Number.isFinite(result.rSquared);
  if (!allFinite) {
    return null;
  }
  return result;
}
