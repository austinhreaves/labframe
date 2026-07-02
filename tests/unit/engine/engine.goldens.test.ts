/**
 * Analytic goldens for the sim physics engine (spec section 6): closed-form
 * solutions the RK4 trajectory and event bisection must reproduce.
 */
import { createEngine, simulate } from '../../../public/sims/lib/engine/engine.js';
import type { Model } from '../../../public/sims/lib/engine/engine.js';

const G = 9.81;

function atwoodModel(M: number, m: number, thetaDeg: number): Model {
  return {
    state: { d: 0, v: 0 },
    params: { M, m, theta: (thetaDeg * Math.PI) / 180, g: G },
    initialMode: 'run',
    modes: {
      run: {
        derivatives: (s, p) => ({
          d: s.v,
          v: (p.g * (p.m - p.M * Math.sin(p.theta))) / (p.M + p.m),
        }),
      },
    },
    observables: {
      KE: (s, p) => 0.5 * (p.M + p.m) * s.v ** 2,
      PE: (s, p) => (p.M * Math.sin(p.theta) - p.m) * p.g * s.d,
      E_dissipated: () => 0,
    },
  };
}

describe('frictionless incline-Atwood (the shipped sim closed form)', () => {
  const regimes: Array<[M: number, m: number, thetaDeg: number]> = [
    [0.2, 0.15, 15],
    [0.2, 0.15, 30],
    [0.25, 0.05, 60],
  ];

  it.each(regimes)('matches d = (1/2) a t^2 for M=%f, m=%f, theta=%f deg', (M, m, thetaDeg) => {
    const theta = (thetaDeg * Math.PI) / 180;
    const a = (G * (m - M * Math.sin(theta))) / (M + m);
    const { states, engine } = simulate(atwoodModel(M, m, thetaDeg), {
      duration: 2,
      energyTol: 1e-9,
    });
    const final = states[states.length - 1]!;
    expect(Math.abs(final.d! - 0.5 * a * 4)).toBeLessThan(1e-9);
    expect(Math.abs(final.v! - a * 2)).toBeLessThan(1e-9);
    expect(engine.mode).toBe('run');
    expect(engine.events).toHaveLength(1);
  });
});

describe('small-angle pendulum', () => {
  it('finds the quarter period by guard bisection', () => {
    const L = 0.5;
    const theta0 = 0.01;
    const model: Model = {
      state: { th: theta0, w: 0 },
      params: { g: G, L },
      initialMode: 'swing',
      modes: {
        swing: {
          derivatives: (s, p) => ({ th: s.w, w: -(p.g / p.L) * Math.sin(s.th) }),
          guards: [{ name: 'bottom', crossed: (s) => s.th!, direction: -1, target: 'done' }],
        },
        done: { derivatives: () => ({}) },
      },
      observables: {
        KE: (s, p) => 0.5 * p.L ** 2 * s.w ** 2,
        PE: (s, p) => p.g * p.L * (1 - Math.cos(s.th!)),
        E_dissipated: () => 0,
      },
    };
    const { events } = simulate(model, { duration: 0.5, energyTol: 1e-8 });
    const fired = events.find((e) => e.event === 'guard_fired')!;
    // Quarter period, including the first amplitude-correction term.
    const T = 2 * Math.PI * Math.sqrt(L / G) * (1 + theta0 ** 2 / 16);
    expect(Math.abs(fired.sim_t - T / 4)).toBeLessThan(2e-6);
    expect(fired.guard).toBe('bottom');
  });
});

describe('linear drag', () => {
  const m = 0.5;
  const b = 0.8;
  const model: Model = {
    state: { y: 0, v: 0, W: 0 },
    params: { m, b, g: G },
    initialMode: 'fall',
    modes: {
      fall: {
        derivatives: (s, p) => ({
          y: s.v,
          v: p.g - (p.b / p.m) * s.v!,
          W: p.b * s.v ** 2,
        }),
      },
    },
    observables: {
      KE: (s, p) => 0.5 * p.m * s.v ** 2,
      PE: (s, p) => -p.m * p.g * s.y!,
      E_dissipated: (s) => s.W!,
    },
  };
  const vT = (m * G) / b;
  const tau = m / b;

  it('approaches the analytic terminal velocity with honest dissipation', () => {
    const { states } = simulate(model, { duration: 5, energyTol: 1e-7 });
    const v = (t: number) => states[Math.round(t / 0.01)]!.v!;
    expect(Math.abs(v(1) - vT * (1 - Math.exp(-1 / tau)))).toBeLessThan(1e-8);
    expect(Math.abs(v(5) - vT * (1 - Math.exp(-5 / tau)))).toBeLessThan(1e-8);
    for (const s of states) expect(s.v).toBeLessThan(vT);
  });
});

describe('spring-mass oscillator', () => {
  it('tracks x = A cos(omega t) with conserved energy', () => {
    const k = 4;
    const m = 1;
    const A = 0.1;
    const model: Model = {
      state: { x: A, v: 0 },
      params: { k, m },
      initialMode: 'oscillate',
      modes: {
        oscillate: { derivatives: (s, p) => ({ x: s.v, v: (-p.k / p.m) * s.x! }) },
      },
      observables: {
        KE: (s, p) => 0.5 * p.m * s.v ** 2,
        PE: (s, p) => 0.5 * p.k * s.x ** 2,
        E_dissipated: () => 0,
      },
    };
    const omega = Math.sqrt(k / m);
    const { states } = simulate(model, { duration: 3, energyTol: 1e-8 });
    for (const t of [1, 2, 3]) {
      const x = states[Math.round(t / 0.01)]!.x!;
      expect(Math.abs(x - A * Math.cos(omega * t))).toBeLessThan(1e-6);
    }
  });
});

describe('projectile with landing guard', () => {
  const m = 0.3;
  const vx0 = 4;
  const vy0 = 6;
  const model: Model = {
    state: { x: 0, y: 0, vx: vx0, vy: vy0, W: 0 },
    params: { m, g: G },
    initialMode: 'flight',
    modes: {
      flight: {
        derivatives: (s) => ({ x: s.vx, y: s.vy, vy: -G }),
        guards: [
          {
            name: 'ground',
            crossed: (s) => s.y!,
            direction: -1,
            target: 'landed',
            reset: (s, p) => ({
              vx: 0,
              vy: 0,
              W: s.W! + 0.5 * p.m * (s.vx ** 2 + s.vy ** 2),
            }),
          },
        ],
      },
      landed: { derivatives: () => ({}) },
    },
    observables: {
      KE: (s, p) => 0.5 * p.m * (s.vx ** 2 + s.vy ** 2),
      PE: (s, p) => p.m * p.g * s.y!,
      E_dissipated: (s) => s.W!,
    },
  };

  it('lands at the analytic time and range, with the reset absorbing the impact KE', () => {
    const { engine, events } = simulate(model, { duration: 2, energyTol: 1e-8 });
    const tLand = (2 * vy0) / G;

    expect(events.map((e) => e.event)).toEqual([
      'mode_enter',
      'guard_fired',
      'mode_exit',
      'reset_applied',
      'mode_enter',
    ]);
    const fired = events[1]!;
    expect(fired.guard).toBe('ground');
    expect(fired.from).toBe('flight');
    expect(fired.to).toBe('landed');
    expect(Math.abs(fired.sim_t - tLand)).toBeLessThan(2e-6);

    // Range: x froze in the landed mode at the bisected event time.
    expect(Math.abs(engine.getState().x! - vx0 * tLand)).toBeLessThan(1e-5);
    expect(engine.mode).toBe('landed');

    // Energy honesty across the impulsive reset.
    const reset = events[3]!;
    const E0 = events[0]!.observables.E_total!;
    expect(Math.abs(reset.observables.E_total! - E0)).toBeLessThan(1e-6);
    expect(engine.observe('KE')).toBe(0);
    expect(engine.observe('E_dissipated')).toBeGreaterThan(0);
  });
});

describe('model validation', () => {
  const base: Model = {
    state: { x: 0 },
    params: {},
    initialMode: 'only',
    modes: { only: { derivatives: () => ({}) } },
    observables: { KE: () => 0, PE: () => 0, E_dissipated: () => 0 },
  };

  it('requires the mandatory energy observables', () => {
    const { E_dissipated: _dropped, ...rest } = base.observables;
    expect(() => createEngine({ ...base, observables: rest })).toThrow(/E_dissipated/);
  });

  it('rejects a model-declared E_total', () => {
    expect(() =>
      createEngine({ ...base, observables: { ...base.observables, E_total: () => 0 } }),
    ).toThrow(/E_total/);
  });

  it('rejects an unknown initial mode', () => {
    expect(() => createEngine({ ...base, initialMode: 'nope' })).toThrow(/initialMode/);
  });

  it('rejects a guard targeting an unknown mode', () => {
    expect(() =>
      createEngine({
        ...base,
        modes: {
          only: {
            derivatives: () => ({}),
            guards: [{ name: 'g', crossed: () => 1, target: 'missing' }],
          },
        },
      }),
    ).toThrow(/unknown mode "missing"/);
  });

  it('rejects a non-finite initial state', () => {
    expect(() => createEngine({ ...base, state: { x: NaN } })).toThrow(/finite/);
  });

  it('throws on reading an unknown observable', () => {
    const engine = createEngine(base);
    expect(() => engine.observe('nope')).toThrow(/Unknown observable/);
    expect(() => engine.read('nope', 0)).toThrow(/Unknown observable/);
  });
});
