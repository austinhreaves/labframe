/**
 * Property tests for the sim physics engine (spec section 6): energy behavior,
 * determinism, and event-time consistency under dt refinement, across random
 * parameters.
 */
import fc from 'fast-check';
import { createEngine, simulate } from '../../../public/sims/lib/engine/engine.js';
import type { Model } from '../../../public/sims/lib/engine/engine.js';

const G = 9.81;

function springModel(m: number, k: number, A: number, c: number): Model {
  return {
    state: { x: A, v: 0, W: 0 },
    params: { m, k, c },
    initialMode: 'oscillate',
    modes: {
      oscillate: {
        derivatives: (s, p) => ({
          x: s.v,
          v: (-p.k * s.x! - p.c * s.v!) / p.m,
          W: p.c * s.v ** 2,
        }),
      },
    },
    observables: {
      KE: (s, p) => 0.5 * p.m * s.v ** 2,
      PE: (s, p) => 0.5 * p.k * s.x ** 2,
      E_dissipated: (s) => s.W!,
    },
  };
}

const positive = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true });

describe('energy accounting properties', () => {
  it('conserves E_total in a conservative oscillator across random parameters', () => {
    fc.assert(
      fc.property(positive(0.5, 5), positive(0.5, 20), positive(0.01, 1), (m, k, A) => {
        const omega = Math.sqrt(k / m);
        // Resolve fast oscillators: keep omega * dt small so the RK4 drift stays
        // inside the assertion tolerance.
        const dt = Math.min(0.01, 0.02 / omega);
        // energyTol makes the engine itself throw on violation.
        const engine = createEngine(springModel(m, k, A, 0), { dt, energyTol: 1e-5 });
        engine.advance(2);
      }),
      { numRuns: 25 },
    );
  });

  it('never increases mechanical energy under damping', () => {
    fc.assert(
      fc.property(
        positive(0.5, 5),
        positive(0.5, 20),
        positive(0.01, 1),
        positive(0.05, 2),
        (m, k, A, c) => {
          const engine = createEngine(springModel(m, k, A, c), { energyTol: 1e-5 });
          let prev = engine.observe('KE') + engine.observe('PE');
          // Slack covers RK4 truncation near turning points, where the true
          // energy derivative (-c v^2) vanishes.
          const slack = 1e-7 * Math.max(1, prev);
          for (let i = 0; i < 200; i += 1) {
            engine.step();
            const mech = engine.observe('KE') + engine.observe('PE');
            expect(mech).toBeLessThanOrEqual(prev + slack);
            prev = mech;
          }
        },
      ),
      { numRuns: 15 },
    );
  });
});

describe('determinism', () => {
  it('identical (model, options) yields identical trajectories and event logs', () => {
    fc.assert(
      fc.property(
        positive(0.5, 5),
        positive(0.5, 20),
        positive(0.01, 1),
        positive(0, 2),
        (m, k, A, c) => {
          const run = () => simulate(springModel(m, k, A, c), { duration: 1 });
          const first = run();
          const second = run();
          expect(second.states).toEqual(first.states);
          expect(second.events).toEqual(first.events);
        },
      ),
      { numRuns: 15 },
    );
  });
});

describe('event bisection under dt refinement', () => {
  function projectileModel(vx0: number, vy0: number): Model {
    return {
      state: { x: 0, y: 0, vx: vx0, vy: vy0 },
      params: { g: G },
      initialMode: 'flight',
      modes: {
        flight: {
          derivatives: (s, p) => ({ x: s.vx, y: s.vy, vy: -p.g }),
          guards: [{ name: 'ground', crossed: (s) => s.y!, direction: -1, target: 'landed' }],
        },
        landed: { derivatives: () => ({}) },
      },
      observables: {
        KE: (s) => 0.5 * (s.vx ** 2 + s.vy ** 2),
        PE: (s, p) => p.g * s.y!,
        E_dissipated: () => 0,
      },
    };
  }

  it('finds the same event time regardless of step size', () => {
    fc.assert(
      fc.property(positive(1, 10), positive(2, 10), (vx0, vy0) => {
        const landTime = (dt: number) => {
          const { events } = simulate(projectileModel(vx0, vy0), { dt, duration: 2.5 });
          return events.find((e) => e.event === 'guard_fired')!.sim_t;
        };
        const coarse = landTime(0.01);
        const fine = landTime(0.0025);
        expect(Math.abs(coarse - fine)).toBeLessThan(5e-6);
        expect(Math.abs(coarse - (2 * vy0) / G)).toBeLessThan(5e-6);
      }),
      { numRuns: 15 },
    );
  });
});
