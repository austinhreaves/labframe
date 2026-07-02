/**
 * Adjustable-angle Atwood machine: engine model for the sim at
 * public/sims/atwood/index.html (Phase E2 reference consumer of
 * docs/specs/PHYSICS_ENGINE_SPEC.md).
 *
 * Minimal coordinates: one coordinate d (string displacement; the cart moves d up
 * the incline while the hanging mass drops d) plus its velocity v. Time rides along
 * as an explicit state coordinate tt (tt' = 1) so the stopwatch is a plain
 * observable and can carry the measurement-noise descriptor.
 *
 * Modes: `run` (accelerating, guarded by the cart reaching the end of its travel)
 * and `done` (frozen). The near-equilibrium 20 s cap is trial policy, not physics,
 * so the sim enforces it outside the model.
 */

/** @typedef {import('../lib/engine/engine.js').Model} Model */
/** @typedef {import('../lib/engine/noise.js').NoiseDescriptor} NoiseDescriptor */

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
 * Closed-form acceleration of the frictionless adjustable-angle Atwood machine:
 * a = g (m - M sin theta) / (M + m).
 *
 * @param {{ M: number, m: number, thetaDeg: number, g: number }} p
 * @returns {number}
 */
export function atwoodAcceleration({ M, m, thetaDeg, g }) {
  const rad = (thetaDeg * Math.PI) / 180;
  return (g * (m - M * Math.sin(rad))) / (M + m);
}

/**
 * Build the engine model for one trial.
 *
 * @param {{ M: number, m: number, thetaDeg: number, g: number, dLimit: number }} p
 *   M cart mass (kg), m hanging mass (kg), thetaDeg track angle (degrees),
 *   g gravitational acceleration (m/s^2), dLimit cart travel that ends the trial (m).
 * @returns {Model}
 */
export function createAtwoodModel({ M, m, thetaDeg, g, dLimit }) {
  const theta = (thetaDeg * Math.PI) / 180;
  return {
    state: { d: 0, v: 0, tt: 0 },
    params: { M, m, theta, g, dLimit },
    initialMode: 'run',
    modes: {
      run: {
        derivatives: (s, p) => ({
          d: s.v,
          v: (p.g * (p.m - p.M * Math.sin(p.theta))) / (p.M + p.m),
          tt: 1,
        }),
        guards: [
          {
            name: 'track_end',
            crossed: (s, p) => p.dLimit - s.d,
            direction: -1,
            target: 'done',
            // Snap d onto the terminal position; bisection stops within timeTol
            // past the crossing. v and tt keep their bisected event values.
            reset: (_s, p) => ({ d: p.dLimit }),
          },
        ],
      },
      done: { derivatives: () => ({}) },
    },
    observables: {
      // Both bodies share the one speed |v| (inextensible string).
      KE: (s, p) => 0.5 * (p.M + p.m) * s.v ** 2,
      // Zero at the start position: cart rises d sin theta, hanging mass drops d.
      PE: (s, p) => (p.M * Math.sin(p.theta) - p.m) * p.g * s.d,
      E_dissipated: () => 0,
      a: (_s, p) => (p.g * (p.m - p.M * Math.sin(p.theta))) / (p.M + p.m),
      // Massless frictionless pulley: one tension on both string segments.
      // (Pulley inertia splits this into tensionCart/tensionHang in Phase E3.)
      tension: (_s, p) => p.m * (p.g - (p.g * (p.m - p.M * Math.sin(p.theta))) / (p.M + p.m)),
      timeReading: { fn: (s) => s.tt, noise: ATWOOD_TIMING_NOISE },
    },
  };
}
