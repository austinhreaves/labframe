/**
 * Mode-switch cases (spec section 6): stiction capture and breakaway at the
 * analytic threshold, slack-string jerk with honest energy accounting, and the
 * chatter policy at Zeno regimes.
 */
import { createEngine, simulate } from '../../../public/sims/lib/engine/engine.js';
import type { Model } from '../../../public/sims/lib/engine/engine.js';

const G = 9.81;

describe('stiction breakaway under a ramped applied force', () => {
  it('fires at |F| = mu_s N to bisection tolerance', () => {
    const m = 2;
    const muS = 0.4;
    const muK = 0.3;
    const c = 5; // F(t) = c t
    const model: Model = {
      state: { x: 0, v: 0, tt: 0, W: 0 },
      params: { m, muS, muK, c, g: G },
      initialMode: 'stuck',
      modes: {
        stuck: {
          derivatives: () => ({ tt: 1 }),
          guards: [
            {
              name: 'breakaway',
              crossed: (s, p) => p.muS * p.m * p.g - p.c * s.tt!,
              direction: -1,
              target: 'moving',
            },
          ],
        },
        moving: {
          derivatives: (s, p) => ({
            x: s.v,
            v: (p.c * s.tt! - p.muK * p.m * p.g) / p.m,
            tt: 1,
            W: p.muK * p.m * p.g * s.v!,
          }),
        },
      },
      // Driven model (the ramp does external work), so no energyTol here.
      observables: {
        KE: (s, p) => 0.5 * p.m * s.v ** 2,
        PE: () => 0,
        E_dissipated: (s) => s.W!,
      },
    };
    const { engine, events } = simulate(model, { duration: 2 });
    const fired = events.find((e) => e.event === 'guard_fired')!;
    const tBreak = (muS * m * G) / c;
    expect(Math.abs(fired.sim_t - tBreak)).toBeLessThan(2e-6);
    expect(engine.mode).toBe('moving');
    expect(engine.getState().v).toBeGreaterThan(0);
  });
});

describe('stiction capture of a sliding block', () => {
  it('stops at v = 0 at the analytic time, having dissipated the initial KE', () => {
    const v0 = 2;
    const muK = 0.25;
    const model: Model = {
      state: { x: 0, v: v0, W: 0 },
      params: { m: 1, muK, g: G },
      initialMode: 'sliding',
      modes: {
        sliding: {
          derivatives: (s, p) => ({
            x: s.v,
            v: -p.muK * p.g,
            W: p.muK * p.m * p.g * s.v!,
          }),
          guards: [{ name: 'stop', crossed: (s) => s.v!, direction: -1, target: 'stuck' }],
        },
        stuck: { derivatives: () => ({}) },
      },
      observables: {
        KE: (s, p) => 0.5 * p.m * s.v ** 2,
        PE: () => 0,
        E_dissipated: (s) => s.W!,
      },
    };
    const { engine, events } = simulate(model, { duration: 2, energyTol: 1e-8 });
    const fired = events.find((e) => e.event === 'guard_fired')!;
    const tStop = v0 / (muK * G);
    const xStop = v0 ** 2 / (2 * muK * G);
    expect(Math.abs(fired.sim_t - tStop)).toBeLessThan(2e-6);
    expect(engine.mode).toBe('stuck');
    const final = engine.getState();
    expect(Math.abs(final.v!)).toBeLessThan(1e-5);
    expect(Math.abs(final.x! - xStop)).toBeLessThan(1e-5);
    expect(Math.abs(final.W! - 0.5 * v0 ** 2)).toBeLessThan(1e-5);
  });
});

describe('slack-string jerk (reset map, spec section 2.2 shape)', () => {
  it('conserves momentum and books the predicted jerk loss into E_dissipated', () => {
    const mA = 0.4;
    const mB = 0.6;
    const v0 = 3;
    const L = 1;
    const model: Model = {
      state: { xA: 0, vA: v0, xB: 0, vB: 0, W: 0 },
      params: { mA, mB, L },
      initialMode: 'slack',
      modes: {
        slack: {
          derivatives: (s) => ({ xA: s.vA, xB: s.vB }),
          guards: [
            {
              name: 'taut',
              crossed: (s, p) => s.xA! - s.xB! - p.L,
              direction: 1,
              target: 'taut',
              reset: (s, p) => {
                const vc = (p.mA * s.vA! + p.mB * s.vB!) / (p.mA + p.mB);
                const mu = (p.mA * p.mB) / (p.mA + p.mB);
                return { vA: vc, vB: vc, W: s.W! + 0.5 * mu * (s.vA! - s.vB!) ** 2 };
              },
            },
          ],
        },
        taut: { derivatives: (s) => ({ xA: s.vA, xB: s.vB }) },
      },
      observables: {
        KE: (s, p) => 0.5 * p.mA * s.vA ** 2 + 0.5 * p.mB * s.vB ** 2,
        PE: () => 0,
        E_dissipated: (s) => s.W!,
      },
    };
    const { engine, events } = simulate(model, { duration: 1, energyTol: 1e-9 });
    const fired = events.find((e) => e.event === 'guard_fired')!;
    expect(Math.abs(fired.sim_t - L / v0)).toBeLessThan(2e-6);

    const vc = (mA * v0) / (mA + mB);
    const loss = 0.5 * ((mA * mB) / (mA + mB)) * v0 ** 2;
    const final = engine.getState();
    expect(Math.abs(final.vA! - vc)).toBeLessThan(1e-9);
    expect(Math.abs(final.vB! - vc)).toBeLessThan(1e-9);
    expect(Math.abs(final.W! - loss)).toBeLessThan(1e-9);
    // Momentum conserved across the jerk.
    expect(Math.abs(mA * final.vA! + mB * final.vB! - mA * v0)).toBeLessThan(1e-9);
    // E_total unchanged through the reset event snapshot.
    const reset = events.find((e) => e.event === 'reset_applied')!;
    const E0 = events[0]!.observables.E_total!;
    expect(Math.abs(reset.observables.E_total! - E0)).toBeLessThan(1e-9);
  });
});

describe('chatter policy: restitution bounce (self-transition) and the Zeno cap', () => {
  const h0 = 1;
  const e = 0.5;
  const model: Model = {
    state: { y: h0, vy: 0, W: 0 },
    params: { m: 1, e, g: G },
    initialMode: 'flight',
    modes: {
      flight: {
        derivatives: (s, p) => ({ y: s.vy, vy: -p.g }),
        guards: [
          {
            name: 'bounce',
            crossed: (s) => s.y!,
            direction: -1,
            target: 'flight',
            // Place the state exactly back on the guard surface (y: 0), since
            // bisection stops within timeTol past the crossing.
            reset: (s, p) => ({
              y: 0,
              vy: -p.e * s.vy!,
              W: s.W! + 0.5 * p.m * (1 - p.e ** 2) * s.vy ** 2,
            }),
          },
        ],
      },
    },
    observables: {
      KE: (s, p) => 0.5 * p.m * s.vy ** 2,
      PE: (s, p) => p.m * p.g * s.y!,
      E_dissipated: (s) => s.W!,
    },
  };

  it('bounces at analytic times without immediate guard re-fire, then throws at Zeno', () => {
    // Tight timeTol: the y: 0 snap injects up to m*g*v*timeTol of PE per bounce,
    // and the energy check must stay meaningful across ~15 bounces.
    const engine = createEngine(model, { energyTol: 1e-7, timeTol: 1e-9 });
    let threw: Error | null = null;
    try {
      for (let i = 0; i < 200; i += 1) engine.step();
    } catch (err) {
      threw = err as Error;
    }
    // The bounce intervals shrink geometrically; the accumulation point lands
    // inside one dt and must throw loudly rather than clamp silently.
    expect(threw).not.toBeNull();
    expect(threw!.message).toMatch(/Zeno/);

    const bounces = engine.events.filter((ev) => ev.event === 'guard_fired');
    expect(bounces.length).toBeGreaterThan(5);
    const t1 = Math.sqrt((2 * h0) / G);
    expect(Math.abs(bounces[0]!.sim_t - t1)).toBeLessThan(2e-6);
    // Second impact after one full restitution arc: t1 + 2 e v1 / g = 2 t1 for e = 0.5.
    expect(Math.abs(bounces[1]!.sim_t - 2 * t1)).toBeLessThan(4e-6);
    // Strictly increasing event times (no chattering at the contact point).
    for (let i = 1; i < bounces.length; i += 1) {
      expect(bounces[i]!.sim_t).toBeGreaterThan(bounces[i - 1]!.sim_t);
    }
    // Each bounce keeps E_total honest by booking the restitution loss.
    const E0 = engine.events[0]!.observables.E_total!;
    for (const b of bounces) {
      expect(Math.abs(b.observables.E_total! - E0)).toBeLessThan(1e-6);
    }
  });
});
