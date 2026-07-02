/**
 * Phase E2 migration validation (spec section 6): the engine-backed Atwood model
 * must match the closed form the shipped sim used, at all three angle regimes
 * plus the near-equilibrium 20 s cap, and the seeded stopwatch noise must
 * reproduce the ~1 percent a_measured spread without touching the trajectory.
 *
 * Phase E3 extension cases: pulley moment of inertia (split tensions), kinetic
 * friction (honest E_dissipated), the stuck initial mode, and stiction capture.
 */
import { createEngine } from '../../../public/sims/lib/engine/engine.js';
import { applyNoise } from '../../../public/sims/lib/engine/noise.js';
import {
  ATWOOD_TIMING_NOISE,
  atwoodAcceleration,
  atwoodBreakawayMargin,
  atwoodTensions,
  createAtwoodModel,
} from '../../../public/sims/atwood/model.js';

// Sim constants (public/sims/atwood/index.html).
const G = 9.8;
const D_LIMIT = 1.2;
const T_MAX = 20;
const SEED = 201;
const PULLEY_R = 0.075;

type TrialParams = {
  M: number;
  m: number;
  thetaDeg: number;
  muS?: number;
  muK?: number;
  pulleyI?: number;
  pulleyR?: number;
  v0?: number;
};

function runTrial(params: TrialParams) {
  const engine = createEngine(createAtwoodModel({ ...params, g: G, dLimit: D_LIMIT }), {
    seed: SEED,
    energyTol: 1e-4,
  });
  let steps = 0;
  while (engine.mode === 'moving' && engine.t < T_MAX) {
    engine.step();
    steps += 1;
    if (steps > 2100) throw new Error('trial did not terminate');
  }
  return engine;
}

describe('engine trajectory vs the shipped closed form (frictionless, massless pulley)', () => {
  // Default parameters, a mid-angle case, and a steep-angle case.
  const regimes: Array<[M: number, m: number, thetaDeg: number]> = [
    [0.5, 0.1, 0],
    [0.5, 0.2, 15],
    [0.3, 0.3, 40],
  ];

  it.each(regimes)('M=%f, m=%f, theta=%f deg ends at the analytic time', (M, m, thetaDeg) => {
    const a = atwoodAcceleration({ M, m, thetaDeg, g: G });
    expect(a).toBeGreaterThan(0);
    const engine = runTrial({ M, m, thetaDeg });
    expect(engine.mode).toBe('done');

    const s = engine.getState();
    const tEnd = Math.sqrt((2 * D_LIMIT) / a);
    // tt froze at the bisected event time; d snapped onto the terminal position.
    expect(Math.abs(s.tt! - tEnd)).toBeLessThan(2e-6);
    expect(s.d).toBe(D_LIMIT);
    expect(Math.abs(s.v! - a * tEnd)).toBeLessThan(1e-5);

    // The guard event carries the same exact end time and the observables.
    const fired = engine.events.find((e) => e.event === 'guard_fired')!;
    expect(fired.guard).toBe('track_end');
    expect(Math.abs(fired.sim_t - tEnd)).toBeLessThan(2e-6);
    // Massless pulley: both segments carry one tension m(g - a).
    expect(Math.abs(fired.observables.tensionHang! - m * (G - a))).toBeLessThan(1e-9);
    expect(Math.abs(fired.observables.tensionCart! - fired.observables.tensionHang!)).toBeLessThan(
      1e-9,
    );
    expect(Math.abs(fired.observables.E_total!)).toBeLessThan(1e-4);
  });

  it('matches d = (1/2) a t^2 mid-trajectory', () => {
    const [M, m, thetaDeg] = [0.5, 0.2, 15];
    const a = atwoodAcceleration({ M, m, thetaDeg, g: G });
    const engine = createEngine(createAtwoodModel({ M, m, thetaDeg, g: G, dLimit: D_LIMIT }), {
      seed: SEED,
      energyTol: 1e-6,
    });
    engine.advance(1);
    const s = engine.getState();
    expect(Math.abs(s.d! - 0.5 * a * 1)).toBeLessThan(1e-9);
    expect(Math.abs(s.v! - a * 1)).toBeLessThan(1e-9);
  });

  it('near equilibrium, the trial reaches the 20 s cap still running', () => {
    // m barely above M sin(theta): a ~ 0.004 m/s^2, d(20 s) ~ 0.78 m < D_LIMIT.
    const [M, m, thetaDeg] = [0.5, 0.2503, 30];
    const a = atwoodAcceleration({ M, m, thetaDeg, g: G });
    expect(Math.abs(a)).toBeLessThan(0.05);
    const engine = runTrial({ M, m, thetaDeg });
    expect(engine.mode).toBe('moving');
    expect(engine.t).toBeGreaterThanOrEqual(T_MAX);
    const s = engine.getState();
    expect(Math.abs(s.d! - 0.5 * a * engine.t ** 2)).toBeLessThan(1e-6);
    expect(s.d).toBeLessThan(D_LIMIT);
  });
});

describe('Phase E3: pulley moment of inertia', () => {
  // Uniform 1 kg disk at the sim pulley radius: I/r^2 = 0.5 kg.
  const params: TrialParams = {
    M: 0.5,
    m: 0.1,
    thetaDeg: 0,
    pulleyI: 0.5 * 1 * PULLEY_R ** 2,
    pulleyR: PULLEY_R,
  };

  it('slows the system by the effective inertia I/r^2 and splits the tensions', () => {
    const a = atwoodAcceleration({ ...params, g: G });
    expect(Math.abs(a - (G * 0.1) / 1.1)).toBeLessThan(1e-12);

    const engine = runTrial(params);
    expect(engine.mode).toBe('done');
    const tEnd = Math.sqrt((2 * D_LIMIT) / a);
    expect(Math.abs(engine.getState().tt! - tEnd)).toBeLessThan(2e-6);

    // Tension split: the difference torques the pulley, (I/r^2) a.
    const fired = engine.events.find((e) => e.event === 'guard_fired')!;
    const { cart, hang } = atwoodTensions({ ...params, g: G });
    expect(Math.abs(fired.observables.tensionCart! - cart)).toBeLessThan(1e-9);
    expect(Math.abs(fired.observables.tensionHang! - hang)).toBeLessThan(1e-9);
    expect(Math.abs(hang - cart - 0.5 * a)).toBeLessThan(1e-9);
    // Energy accounting includes the pulley's rotational KE (engine asserted
    // E_total via energyTol; spot-check KE at the event).
    const vEnd = engine.getState().v!;
    expect(Math.abs(fired.observables.KE! - 0.5 * 1.1 * vEnd ** 2)).toBeLessThan(1e-9);
  });
});

describe('Phase E3: kinetic friction', () => {
  const params: TrialParams = { M: 0.5, m: 0.3, thetaDeg: 20, muS: 0.2, muK: 0.2 };

  it('decelerates by mu_k M g cos(theta) and books the dissipation honestly', () => {
    const rad = (20 * Math.PI) / 180;
    const a = atwoodAcceleration({ ...params, g: G });
    expect(
      Math.abs(a - (G * (0.3 - 0.5 * Math.sin(rad) - 0.2 * 0.5 * Math.cos(rad))) / 0.8),
    ).toBeLessThan(1e-12);
    expect(a).toBeGreaterThan(0);

    // energyTol inside runTrial is the real assertion: KE + PE + W conserved.
    const engine = runTrial(params);
    expect(engine.mode).toBe('done');
    const s = engine.getState();
    const tEnd = Math.sqrt((2 * D_LIMIT) / a);
    expect(Math.abs(s.tt! - tEnd)).toBeLessThan(2e-6);
    // E_dissipated = f * d at the end of travel.
    const f = 0.2 * 0.5 * G * Math.cos(rad);
    expect(Math.abs(s.W! - f * D_LIMIT)).toBeLessThan(1e-6);
  });
});

describe('Phase E3: the stuck/moving mode pair', () => {
  it('starts stuck when static friction beats the driving force', () => {
    const params: TrialParams = { M: 0.5, m: 0.1, thetaDeg: 0, muS: 0.3, muK: 0.3 };
    expect(atwoodBreakawayMargin({ ...params, g: G })).toBeLessThan(0);
    const engine = createEngine(createAtwoodModel({ ...params, g: G, dLimit: D_LIMIT }), {
      seed: SEED,
      energyTol: 1e-9,
    });
    expect(engine.mode).toBe('stuck');
    engine.advance(1);
    expect(engine.mode).toBe('stuck');
    const s = engine.getState();
    expect(s.d).toBe(0);
    expect(s.v).toBe(0);
    expect(Math.abs(s.tt! - 1)).toBeLessThan(1e-9); // time still flows while stuck
  });

  it('captures a push-started cart when kinetic friction overwhelms the driving force', () => {
    // v0 > 0 forces the moving mode even though the margin is negative.
    const params: TrialParams = { M: 0.5, m: 0.1, thetaDeg: 0, muS: 0.5, muK: 0.5, v0: 1 };
    expect(atwoodBreakawayMargin({ ...params, g: G })).toBeLessThan(0);
    const a = atwoodAcceleration({ ...params, g: G });
    expect(a).toBeLessThan(0);

    const engine = createEngine(createAtwoodModel({ ...params, g: G, dLimit: D_LIMIT }), {
      seed: SEED,
      energyTol: 1e-6,
    });
    expect(engine.mode).toBe('moving');
    engine.advance(1);
    expect(engine.mode).toBe('stuck');

    const fired = engine.events.find((e) => e.event === 'guard_fired')!;
    expect(fired.guard).toBe('stiction_capture');
    const tStop = 1 / Math.abs(a);
    expect(Math.abs(fired.sim_t - tStop)).toBeLessThan(2e-6);

    const s = engine.getState();
    expect(s.v).toBe(0); // reset snapped v onto the guard surface
    const dStop = 1 / (2 * Math.abs(a));
    expect(Math.abs(s.d! - dStop)).toBeLessThan(1e-5);
    // All the initial KE plus the released PE went into friction heat.
    const expectedW = 0.5 * 0.6 * 1 + 0.1 * G * s.d!;
    expect(Math.abs(s.W! - expectedW)).toBeLessThan(1e-5);
    // Once captured, it stays captured (breakaway margin is negative).
    engine.advance(1);
    expect(engine.mode).toBe('stuck');
    expect(engine.getState().d).toBe(s.d);
  });
});

describe('seeded stopwatch noise (the pedagogical percent-error gap)', () => {
  it('perturbs the reading, not the trajectory, and reproduces per seed', () => {
    const engine = runTrial({ M: 0.5, m: 0.1, thetaDeg: 0 });
    const again = runTrial({ M: 0.5, m: 0.1, thetaDeg: 0 });
    const tClean = engine.getState().tt!;

    const reading = engine.read('timeReading', 1);
    expect(again.read('timeReading', 1)).toBe(reading);
    expect(reading).not.toBe(tClean);
    expect(Math.abs(reading / tClean - 1)).toBeLessThan(0.03);
    // The clean trajectory is untouched by reads.
    expect(engine.observe('timeReading')).toBe(tClean);
    expect(engine.getState()).toEqual(again.getState());
  });

  it('sizes a_measured = 2d/t^2 to a ~1 percent spread around a_theoretical', () => {
    const a = atwoodAcceleration({ M: 0.5, m: 0.1, thetaDeg: 0, g: G });
    const tClean = Math.sqrt((2 * D_LIMIT) / a);
    const relErrors: number[] = [];
    for (let i = 0; i < 500; i += 1) {
      const t = applyNoise(tClean, ATWOOD_TIMING_NOISE, SEED, i);
      relErrors.push((2 * D_LIMIT) / t ** 2 / a - 1);
    }
    const mean = relErrors.reduce((acc, e) => acc + e, 0) / relErrors.length;
    const std = Math.sqrt(
      relErrors.reduce((acc, e) => acc + (e - mean) ** 2, 0) / relErrors.length,
    );
    // sigma_t = 0.5% relative, so sigma_a is ~1%.
    expect(Math.abs(mean)).toBeLessThan(0.002);
    expect(std).toBeGreaterThan(0.006);
    expect(std).toBeLessThan(0.016);
  });
});
