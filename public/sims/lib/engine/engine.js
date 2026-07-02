/**
 * LabFrame custom-sim physics engine - Phase E1 core.
 *
 * Hybrid-dynamics ODE engine in minimal coordinates (docs/specs/PHYSICS_ENGINE_SPEC.md).
 * A sim hands the engine a model (named state, per-mode derivatives, guarded
 * transitions, named observables); the engine returns a stepped trajectory plus an
 * in-memory event log. Dependency-free ES module: sims under public/sims/ import it
 * directly via <script type="module">, and Vitest imports the same file for the unit
 * suite. No DOM, no canvas, no postMessage, no wall clock, no Math.random: identical
 * (model, options) input yields an identical trajectory and event log on every machine.
 *
 * Integrator: fixed-timestep RK4 (dt = 0.01 s default). Guards are checked once per
 * (sub)step endpoint; a sign crossing is bisected to `timeTol`, the reset map applied,
 * and integration resumes in the target mode. A guard whose value dips through zero
 * and back inside a single step is not detected; keep dt small relative to the
 * dynamics, as always.
 *
 * Chatter control (spec section 6, decided in Phase E1): a guard fires only when its
 * value at the start of the (sub)step is strictly on the departing side, or exactly
 * zero with the (sub)step ending strictly across the surface. A guard sitting at zero
 * on mode entry therefore cannot re-fire from the surface itself, but a trajectory
 * that leaves the surface and re-crosses within the same substep is still caught.
 * Genuine Zeno regimes (e.g. a restitution bounce settling to rest) hit
 * `maxTransitionsPerStep` and throw loudly; the model author resolves them with a
 * terminating mode, never a silent clamp.
 *
 * Module contract (grep public/sims/* /index.html before changing exports):
 *   createEngine(model, options) -> engine
 *   simulate(model, options)     -> { engine, times, states, events }
 */

import { applyNoise } from './noise.js';

/** @typedef {Record<string, number>} NumMap */
/** @typedef {import('./noise.js').NoiseDescriptor} NoiseDescriptor */

/**
 * @typedef {object} GuardDef
 * @property {string} name Stable identifier; appears in the engine event log.
 * @property {(state: NumMap, params: NumMap) => number} crossed Signed guard function;
 *   the mode ends when its value crosses zero (see `direction`).
 * @property {-1 | 1} [direction] Restrict to falling (-1: strictly positive to
 *   non-positive) or rising (+1: strictly negative to non-negative) crossings.
 *   Default: either direction.
 * @property {string} target Mode entered when the guard fires. May name the current
 *   mode (self-transition, e.g. a restitution bounce).
 * @property {(state: NumMap, params: NumMap) => NumMap} [reset] Optional impulsive
 *   map applied at the bisected event time. Returns a partial state patch;
 *   coordinates it omits carry over unchanged. When the target mode reuses the same
 *   guard surface (e.g. a restitution bounce), the reset should place the state
 *   exactly on the surface (y: 0), since bisection stops within timeTol PAST the
 *   crossing; the engine never snaps state itself.
 */

/**
 * @typedef {object} ModeDef
 * @property {(state: NumMap, params: NumMap) => NumMap} derivatives Named time
 *   derivatives. Coordinates omitted from the returned map integrate as zero.
 * @property {GuardDef[]} [guards]
 */

/**
 * @typedef {(state: NumMap, params: NumMap, mode: string) => number} ObservableFn
 */

/**
 * @typedef {ObservableFn | { fn: ObservableFn, noise?: NoiseDescriptor }} ObservableDef
 */

/**
 * @typedef {object} Model
 * @property {NumMap} state Initial named coordinates and velocities.
 * @property {NumMap} params Named constants.
 * @property {string} initialMode
 * @property {Record<string, ModeDef>} modes At least one; exactly one active at a time.
 * @property {Record<string, ObservableDef>} observables Must include `KE`, `PE`, and
 *   `E_dissipated` (energy accounting is mandatory, spec section 2). `E_total` is
 *   derived by the engine and must not be declared. Path-dependent quantities
 *   (dissipated energy, distance traveled) belong in `state` as integrated
 *   coordinates or reset-map increments, so observables stay pure.
 */

/**
 * @typedef {object} EngineEvent
 * @property {'mode_enter' | 'mode_exit' | 'guard_fired' | 'reset_applied'} event
 * @property {string} [from] Mode name being left, when applicable.
 * @property {string} [to] Mode name being entered, when applicable.
 * @property {string} [guard] Guard that fired, when applicable.
 * @property {number} sim_t Simulation time of the event (seconds, post-bisection).
 * @property {NumMap} observables Snapshot of all named observables (incl. E_total).
 */

/**
 * @typedef {object} EngineOptions
 * @property {number} [dt] Fixed timestep in seconds, default 0.01.
 * @property {number} [timeTol] Event bisection tolerance in seconds, default 1e-6.
 * @property {number} [maxTransitionsPerStep] Chatter cap, default 8; exceeding it
 *   throws (Zeno regime in the model).
 * @property {number} [seed] Integer seed for the measurement-noise layer, default 0.
 * @property {number} [energyTol] When set, assert after every step that E_total
 *   drifts from its initial value by at most energyTol * max(1, |E_total(0)|),
 *   throwing on violation. Leave unset for driven models (external work input).
 */

const REQUIRED_OBSERVABLES = ['KE', 'PE', 'E_dissipated'];

/**
 * @param {NumMap} map
 * @param {string} key
 * @returns {number}
 */
function num(map, key) {
  const value = map[key];
  return value === undefined ? 0 : value;
}

/**
 * @param {Model} model
 */
function validateModel(model) {
  if (!model.modes || Object.keys(model.modes).length === 0) {
    throw new Error('Model must declare at least one mode');
  }
  if (!model.modes[model.initialMode]) {
    throw new Error(`initialMode "${model.initialMode}" is not a declared mode`);
  }
  for (const [modeName, mode] of Object.entries(model.modes)) {
    for (const guard of mode.guards ?? []) {
      if (!model.modes[guard.target]) {
        throw new Error(
          `Guard "${guard.name}" in mode "${modeName}" targets unknown mode "${guard.target}"`,
        );
      }
    }
  }
  for (const name of REQUIRED_OBSERVABLES) {
    if (!(name in model.observables)) {
      throw new Error(
        `Model must declare the "${name}" observable (energy accounting is mandatory)`,
      );
    }
  }
  if ('E_total' in model.observables) {
    throw new Error('"E_total" is derived by the engine; do not declare it');
  }
  for (const [key, value] of Object.entries(model.state)) {
    if (!Number.isFinite(value)) {
      throw new Error(`Initial state "${key}" is not a finite number`);
    }
  }
}

/**
 * Create a stepping engine for a model. State, time, and the event log are private
 * to the returned engine; two engines over the same model never interact.
 *
 * @param {Model} model
 * @param {EngineOptions} [options]
 */
export function createEngine(model, options = {}) {
  validateModel(model);

  const dt = options.dt ?? 0.01;
  const timeTol = options.timeTol ?? 1e-6;
  const maxTransitionsPerStep = options.maxTransitionsPerStep ?? 8;
  const seed = options.seed ?? 0;
  const energyTol = options.energyTol;

  const params = { ...model.params };
  const stateKeys = Object.keys(model.state);

  /** @type {NumMap} */
  let state = { ...model.state };
  let modeName = model.initialMode;
  let stepCount = 0;
  let t = 0;

  /** @type {EngineEvent[]} */
  const events = [];

  /** @type {Record<string, { fn: ObservableFn, noise?: NoiseDescriptor }>} */
  const observables = {};
  for (const [name, def] of Object.entries(model.observables)) {
    observables[name] = typeof def === 'function' ? { fn: def } : def;
  }
  const keDef = observables['KE'];
  const peDef = observables['PE'];
  const edDef = observables['E_dissipated'];
  observables['E_total'] = {
    fn: (s, p, m) => keDef.fn(s, p, m) + peDef.fn(s, p, m) + edDef.fn(s, p, m),
  };
  const observableNames = Object.keys(observables);

  /**
   * @param {string} name
   * @param {NumMap} s
   * @returns {number}
   */
  function evalObservable(name, s) {
    const def = observables[name];
    if (!def) throw new Error(`Unknown observable "${name}"`);
    return def.fn(s, params, modeName);
  }

  /** @returns {NumMap} */
  function snapshotObservables() {
    /** @type {NumMap} */
    const out = {};
    for (const name of observableNames) out[name] = evalObservable(name, state);
    return out;
  }

  const E0 = evalObservable('E_total', state);

  /**
   * @param {NumMap} s
   * @param {NumMap} k
   * @param {number} h
   * @returns {NumMap}
   */
  function shift(s, k, h) {
    /** @type {NumMap} */
    const out = {};
    for (const key of stateKeys) out[key] = num(s, key) + h * num(k, key);
    return out;
  }

  /**
   * One RK4 step of size h from state s under the given mode's derivatives.
   *
   * @param {ModeDef} mode
   * @param {NumMap} s
   * @param {number} h
   * @returns {NumMap}
   */
  function rk4(mode, s, h) {
    const k1 = mode.derivatives(s, params);
    const k2 = mode.derivatives(shift(s, k1, h / 2), params);
    const k3 = mode.derivatives(shift(s, k2, h / 2), params);
    const k4 = mode.derivatives(shift(s, k3, h), params);
    /** @type {NumMap} */
    const out = {};
    for (const key of stateKeys) {
      out[key] =
        num(s, key) + (h / 6) * (num(k1, key) + 2 * num(k2, key) + 2 * num(k3, key) + num(k4, key));
    }
    return out;
  }

  /**
   * Crossing kind by the end of the span, or null when the guard did not fire.
   *
   * A guard fires when its start value is strictly on the departing side, OR is
   * exactly zero with the end value strictly on the crossing side. The second
   * clause matters after a reset map that places the state exactly on the
   * switching surface (e.g. y: 0 at a bounce): the guard must not fire from the
   * surface itself (no immediate re-fire), but a trajectory that leaves the
   * surface and ends across it within the same substep is a real crossing;
   * ignoring it would tunnel silently instead of hitting the chatter cap.
   *
   * @param {GuardDef} guard
   * @param {number} g0
   * @param {number} g1
   * @returns {'falling' | 'rising' | null}
   */
  function crossingKind(guard, g0, g1) {
    const falling = (g0 > 0 && g1 <= 0) || (g0 === 0 && g1 < 0);
    const rising = (g0 < 0 && g1 >= 0) || (g0 === 0 && g1 > 0);
    if (guard.direction === -1) return falling ? 'falling' : null;
    if (guard.direction === 1) return rising ? 'rising' : null;
    if (falling) return 'falling';
    return rising ? 'rising' : null;
  }

  /**
   * Bisect the crossing time of a guard known to have crossed within span.
   *
   * @param {ModeDef} mode
   * @param {GuardDef} guard
   * @param {NumMap} s0
   * @param {'falling' | 'rising'} kind
   * @param {number} span
   * @returns {number} substep size h at which the guard has crossed
   */
  function bisectCrossing(mode, guard, s0, kind, span) {
    let lo = 0;
    let hi = span;
    while (hi - lo > timeTol) {
      const mid = (lo + hi) / 2;
      const gMid = guard.crossed(rk4(mode, s0, mid), params);
      const crossed = kind === 'falling' ? gMid <= 0 : gMid >= 0;
      if (crossed) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  /**
   * Earliest guard crossing within span, or null. Ties break by declaration order.
   *
   * @param {ModeDef} mode
   * @param {NumMap} s0
   * @param {NumMap} s1
   * @param {number} span
   * @returns {{ guard: GuardDef, h: number } | null}
   */
  function findEarliestCrossing(mode, s0, s1, span) {
    const guards = mode.guards;
    if (!guards || guards.length === 0) return null;
    /** @type {{ guard: GuardDef, h: number } | null} */
    let best = null;
    for (const guard of guards) {
      const g0 = guard.crossed(s0, params);
      const g1 = guard.crossed(s1, params);
      const kind = crossingKind(guard, g0, g1);
      if (kind === null) continue;
      const h = bisectCrossing(mode, guard, s0, kind, span);
      if (best === null || h < best.h) best = { guard, h };
    }
    return best;
  }

  /**
   * @param {Omit<EngineEvent, 'sim_t' | 'observables'>} partial
   */
  function pushEvent(partial) {
    events.push({ ...partial, sim_t: t, observables: snapshotObservables() });
  }

  /**
   * @param {GuardDef} guard
   */
  function applyTransition(guard) {
    const from = modeName;
    const to = guard.target;
    pushEvent({ event: 'guard_fired', guard: guard.name, from, to });
    pushEvent({ event: 'mode_exit', guard: guard.name, from, to });
    if (guard.reset) {
      const patch = guard.reset(state, params);
      /** @type {NumMap} */
      const next = { ...state };
      for (const key of stateKeys) {
        const value = patch[key];
        if (value !== undefined) next[key] = value;
      }
      state = next;
      pushEvent({ event: 'reset_applied', guard: guard.name, from, to });
    }
    modeName = to;
    pushEvent({ event: 'mode_enter', guard: guard.name, from, to });
  }

  function checkEnergy() {
    const E = evalObservable('E_total', state);
    const scale = Math.max(1, Math.abs(E0));
    if (!(Math.abs(E - E0) <= /** @type {number} */ (energyTol) * scale)) {
      throw new Error(
        `Energy accounting violated at t=${t.toFixed(6)}s (mode "${modeName}"): ` +
          `E_total=${E} vs initial ${E0}, tolerance ${energyTol} * ${scale}`,
      );
    }
  }

  /** Advance exactly one fixed timestep, handling any guard crossings inside it. */
  function step() {
    const tStart = stepCount * dt;
    let consumed = 0;
    let transitions = 0;
    while (consumed < dt) {
      const remaining = dt - consumed;
      const mode = model.modes[modeName];
      const proposed = rk4(mode, state, remaining);
      const hit = findEarliestCrossing(mode, state, proposed, remaining);
      if (hit === null) {
        state = proposed;
        consumed = dt;
        break;
      }
      transitions += 1;
      if (transitions > maxTransitionsPerStep) {
        throw new Error(
          `Guard chattering: more than ${maxTransitionsPerStep} mode transitions inside one ` +
            `dt=${dt}s step near t=${(tStart + consumed).toFixed(6)}s (mode "${modeName}"). ` +
            'Likely a Zeno regime; give the model a terminating mode or guard.',
        );
      }
      state = rk4(mode, state, hit.h);
      consumed += hit.h;
      t = tStart + consumed;
      applyTransition(hit.guard);
    }
    stepCount += 1;
    t = stepCount * dt;
    if (energyTol !== undefined) checkEnergy();
  }

  const engine = {
    dt,
    /** Current simulation time in seconds. */
    get t() {
      return t;
    },
    /** Name of the active mode. */
    get mode() {
      return modeName;
    },
    /** Full engine event log (mode transitions, guard firings, resets), in order. */
    get events() {
      return events;
    },
    /** @returns {NumMap} copy of the current state */
    getState() {
      return { ...state };
    },
    step,
    /**
     * Advance by a duration (rounded to whole steps).
     *
     * @param {number} seconds
     */
    advance(seconds) {
      const n = Math.round(seconds / dt);
      for (let i = 0; i < n; i += 1) step();
    },
    /**
     * Clean (noise-free) value of a named observable at the current state.
     *
     * @param {string} name
     * @returns {number}
     */
    observe(name) {
      return evalObservable(name, state);
    },
    /**
     * Instrument reading of a named observable: the clean value perturbed by the
     * observable's declared noise descriptor (if any) under the engine seed. Pure
     * in (seed, sampleIndex); reading never mutates engine state.
     *
     * @param {string} name
     * @param {number} sampleIndex integer index of this reading
     * @returns {number}
     */
    read(name, sampleIndex) {
      const def = observables[name];
      if (!def) throw new Error(`Unknown observable "${name}"`);
      const clean = def.fn(state, params, modeName);
      return def.noise ? applyNoise(clean, def.noise, seed, sampleIndex) : clean;
    },
    /** @returns {NumMap} all observables (incl. derived E_total), clean values */
    snapshot() {
      return snapshotObservables();
    },
  };

  pushEvent({ event: 'mode_enter', to: modeName });
  return engine;
}

/**
 * Convenience runner: create an engine and step it for a duration, sampling the
 * state after every step.
 *
 * @param {Model} model
 * @param {EngineOptions & { duration?: number }} [options]
 */
export function simulate(model, options = {}) {
  const engine = createEngine(model, options);
  const duration = options.duration ?? 10;
  const n = Math.round(duration / engine.dt);
  const times = [engine.t];
  const states = [engine.getState()];
  for (let i = 0; i < n; i += 1) {
    engine.step();
    times.push(engine.t);
    states.push(engine.getState());
  }
  return { engine, times, states, events: engine.events };
}
