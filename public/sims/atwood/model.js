/**
 * Adjustable-angle Atwood machine: engine model for the sim at
 * public/sims/atwood/index.html (Phase E2 reference consumer of
 * docs/specs/PHYSICS_ENGINE_SPEC.md; Phase E3 adds pulley moment of inertia and
 * static/kinetic track friction).
 *
 * Minimal coordinates: one coordinate d (string displacement; the cart moves d up
 * the incline while the hanging mass drops d) plus its velocity v. Time rides along
 * as an explicit state coordinate tt (tt' = 1) so the stopwatch is a plain
 * observable and can carry the measurement-noise descriptor. W accumulates the
 * energy dissipated by kinetic friction (W' = mu_k N |v|).
 *
 * Modes:
 *   `stuck`  - static friction holds the cart (initial mode when the driving force
 *              cannot beat mu_s N and the cart is not already moving). The
 *              breakaway guard is declared for model honesty; with constant
 *              parameters it can never fire mid-trial.
 *   `moving` - forward motion (v >= 0; the derivative expressions assume up-slope
 *              travel, which the stiction-capture guard enforces). Guarded by the
 *              cart reaching the end of its travel, and by v falling through zero
 *              when kinetic friction overwhelms the driving force.
 *   `done`   - frozen terminal mode. The near-equilibrium 20 s cap is trial
 *              policy, not physics, so the sim enforces it outside the model.
 *
 * With pulley inertia the two string tensions differ (their difference torques
 * the pulley), so `tensionCart` and `tensionHang` are two observables, not one T.
 */

/** @typedef {import('../lib/engine/engine.js').Model} Model */
/** @typedef {import('../lib/engine/noise.js').NoiseDescriptor} NoiseDescriptor */

/**
 * @typedef {object} AtwoodParams
 * @property {number} M cart mass (kg)
 * @property {number} m hanging mass (kg)
 * @property {number} thetaDeg track angle (degrees)
 * @property {number} g gravitational acceleration (m/s^2)
 * @property {number} [muS] static friction coefficient, cart-track (default 0)
 * @property {number} [muK] kinetic friction coefficient, cart-track (default 0)
 * @property {number} [pulleyI] pulley moment of inertia (kg m^2, default 0)
 * @property {number} [pulleyR] pulley radius (m, default 1; only I/r^2 matters)
 */

/**
 * Stopwatch noise for the timing readout (spec section 2.1.1). Sized so
 * a_measured = 2d/t^2 lands within roughly 1 percent of a_theoretical (the sigma
 * on a is twice the sigma on t), reproducing the percent-error feel the Euler-era
 * integrator produced by accident.
 *
 * @type {NoiseDescriptor}
 */
export const ATWOOD_TIMING_NOISE = { kind: 'gaussian', relative: 0.005 };

/**
 * Closed-form acceleration during forward motion:
 * a = g (m - M sin theta - mu_k M cos theta) / (M + m + I/r^2).
 *
 * @param {AtwoodParams} p
 * @returns {number}
 */
export function atwoodAcceleration({ M, m, thetaDeg, g, muK = 0, pulleyI = 0, pulleyR = 1 }) {
  const rad = (thetaDeg * Math.PI) / 180;
  return (g * (m - M * Math.sin(rad) - muK * M * Math.cos(rad))) / (M + m + pulleyI / pulleyR ** 2);
}

/**
 * Net driving force minus the maximum static friction, in newtons:
 * m g - M g sin theta - mu_s M g cos theta. The cart can start moving forward
 * only when this is positive.
 *
 * @param {AtwoodParams} p
 * @returns {number}
 */
export function atwoodBreakawayMargin({ M, m, thetaDeg, g, muS = 0 }) {
  const rad = (thetaDeg * Math.PI) / 180;
  return m * g - M * g * Math.sin(rad) - muS * M * g * Math.cos(rad);
}

/**
 * String tensions during forward motion. With pulley inertia they differ by
 * (I/r^2) a, the net force that torques the pulley.
 *
 * @param {AtwoodParams} p
 * @returns {{ cart: number, hang: number }}
 */
export function atwoodTensions(p) {
  const { M, m, thetaDeg, g, muK = 0 } = p;
  const rad = (thetaDeg * Math.PI) / 180;
  const a = atwoodAcceleration(p);
  return {
    cart: M * (a + g * Math.sin(rad) + muK * g * Math.cos(rad)),
    hang: m * (g - a),
  };
}

/**
 * Build the engine model for one trial.
 *
 * @param {AtwoodParams & { dLimit: number, v0?: number }} p
 *   dLimit is the cart travel that ends the trial (m); v0 an optional initial
 *   speed (m/s, default 0; used by tests and push-start scenarios).
 * @returns {Model}
 */
export function createAtwoodModel(p) {
  const { M, m, thetaDeg, g, dLimit, muS = 0, muK = 0, pulleyI = 0, pulleyR = 1, v0 = 0 } = p;
  const theta = (thetaDeg * Math.PI) / 180;
  // Discrete state at t = 0: already moving, or held by static friction.
  const initialMode = v0 > 0 || atwoodBreakawayMargin(p) > 0 ? 'moving' : 'stuck';
  return {
    state: { d: 0, v: v0, tt: 0, W: 0 },
    params: { M, m, theta, g, dLimit, muS, muK, pulleyI, pulleyR },
    initialMode,
    modes: {
      stuck: {
        derivatives: () => ({ tt: 1 }),
        guards: [
          {
            name: 'breakaway',
            // Fires when the driving force exceeds the static friction cone.
            crossed: (_s, p2) =>
              p2.muS * p2.M * p2.g * Math.cos(p2.theta) -
              (p2.m * p2.g - p2.M * p2.g * Math.sin(p2.theta)),
            direction: -1,
            target: 'moving',
          },
        ],
      },
      moving: {
        derivatives: (s, p2) => ({
          d: s.v,
          v:
            (p2.g * (p2.m - p2.M * Math.sin(p2.theta) - p2.muK * p2.M * Math.cos(p2.theta))) /
            (p2.M + p2.m + p2.pulleyI / p2.pulleyR ** 2),
          tt: 1,
          W: p2.muK * p2.M * p2.g * Math.cos(p2.theta) * Math.abs(s.v),
        }),
        guards: [
          {
            name: 'track_end',
            crossed: (s, p2) => p2.dLimit - s.d,
            direction: -1,
            target: 'done',
            // Snap d onto the terminal position; bisection stops within timeTol
            // past the crossing. v and tt keep their bisected event values.
            reset: (_s, p2) => ({ d: p2.dLimit }),
          },
          {
            name: 'stiction_capture',
            // Kinetic friction overwhelmed the driving force and v fell to zero.
            crossed: (s) => s.v,
            direction: -1,
            target: 'stuck',
            reset: () => ({ v: 0 }),
          },
        ],
      },
      done: { derivatives: () => ({}) },
    },
    observables: {
      // Total kinetic energy: both bodies share |v|, the pulley spins at v/r.
      KE: (s, p2) => 0.5 * (p2.M + p2.m + p2.pulleyI / p2.pulleyR ** 2) * s.v ** 2,
      // Zero at the start position: cart rises d sin theta, hanging mass drops d.
      PE: (s, p2) => (p2.M * Math.sin(p2.theta) - p2.m) * p2.g * s.d,
      E_dissipated: (s) => s.W,
      a: (_s, p2, mode) =>
        mode === 'moving'
          ? (p2.g * (p2.m - p2.M * Math.sin(p2.theta) - p2.muK * p2.M * Math.cos(p2.theta))) /
            (p2.M + p2.m + p2.pulleyI / p2.pulleyR ** 2)
          : 0,
      // At rest (stuck/done) nothing accelerates, so both segments carry the
      // hanging weight; during motion the difference (I/r^2) a torques the pulley.
      tensionCart: (_s, p2, mode) => {
        if (mode !== 'moving') return p2.m * p2.g;
        const a =
          (p2.g * (p2.m - p2.M * Math.sin(p2.theta) - p2.muK * p2.M * Math.cos(p2.theta))) /
          (p2.M + p2.m + p2.pulleyI / p2.pulleyR ** 2);
        return p2.M * (a + p2.g * Math.sin(p2.theta) + p2.muK * p2.g * Math.cos(p2.theta));
      },
      tensionHang: (_s, p2, mode) => {
        if (mode !== 'moving') return p2.m * p2.g;
        const a =
          (p2.g * (p2.m - p2.M * Math.sin(p2.theta) - p2.muK * p2.M * Math.cos(p2.theta))) /
          (p2.M + p2.m + p2.pulleyI / p2.pulleyR ** 2);
        return p2.m * (p2.g - a);
      },
      timeReading: { fn: (s) => s.tt, noise: ATWOOD_TIMING_NOISE },
    },
  };
}
