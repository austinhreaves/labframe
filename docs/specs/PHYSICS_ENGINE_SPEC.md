# Custom Sim Physics Engine - Spec

**Status:** Decisions locked 2026-07-02 (Section 9). **Phase E1 built 2026-07-02:**
engine core at `public/sims/lib/engine/` (engine.js + noise.js, JSDoc ES modules,
typechecked via `tsconfig.engine.json`) with the Section 6 test suite under
`tests/unit/engine/`. **Phase E2 built 2026-07-02:** the Atwood sim runs on the
engine (model at `public/sims/atwood/model.js`, migration validation in
`tests/unit/engine/atwood.migration.test.ts`); RK4 replaced Euler, the percent-error
gap moved to seeded stopwatch noise (gaussian, 0.5 percent relative on the timing
readout, seed fixed at 201 until the envelope seed slot is wired), and the sim
forwards `engine_event` telemetry. Note the sim iframe now needs
`sandbox: 'allow-scripts allow-same-origin'`: module scripts fetch in CORS mode,
so relative engine imports fail under an opaque origin on static hosting.
Phase E3 (pulley inertia + friction) is next.

**Companion to:** `docs/handoffs/n2l-atwood-sim-handoff.md` (the first custom sim, shipped
without an engine), `docs/SPEC.md` (product/eng scope), and
`docs/decisions/0002-no-backend-lock.md` (everything runs client-side).

**North star:** a complete set of custom physics sims across the intro-physics concept
range (mechanics through E&M), all served as standalone static assets under
`public/sims/`, all emitting the same telemetry envelope for the future Socratic AI
layer. The Atwood machine sim is the first working example and the reference consumer
for this engine.

---

## 1. The sizing question, answered up front

How large does the engine's blast radius need to be? **Small, and the boundary is
precise: a hybrid-dynamics ODE engine in minimal coordinates, not a rigid-body game
engine.**

Three candidate sizes were considered:

| Tier | Shape                                                                                                                                                                                   | Verdict                                                                                                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Status quo: each sim hand-rolls its own closed-form or Euler loop                                                                                                                       | Fine for one sim, quadratic pain across a catalog; mode switching (stiction, slack strings) is where hand-rolled loops silently go wrong                                              |
| 1    | **Hybrid ODE engine in minimal (generalized) coordinates**: sims declare named state variables, per-mode derivative functions, guarded transitions between modes, and named observables | **Recommended.** Covers the entire visible roadmap; small enough to be verified against analytic solutions                                                                            |
| 2    | Constraint-based 2D rigid-body engine (Box2D-shaped): bodies, joints, contact manifolds, impulse solver                                                                                 | Overkill. Numerically fussy (constraint drift, solver tuning), harder to make bit-deterministic, and worse pedagogically: forces become solver outputs instead of legible expressions |

The argument for Tier 1 is that every sim on the plausible roadmap has **few degrees of
freedom and legible dynamics**, but many have **mode switches**, and mode switching is
the part that is genuinely hard to hand-roll correctly:

- Adjustable-angle Atwood (1 DOF), plus pulley inertia, plus friction, plus drag
- Spring-Atwood with slack-string failure mode (1 DOF taut, 2 DOF slack)
- Blocks with static/kinetic friction (stiction capture and breakaway)
- Projectiles with drag (2 DOF, no modes)
- Pendula, spring-mass oscillators, driven/damped oscillations (1 DOF)
- 1D carts and collisions (impulsive reset maps)
- RC/RL circuits if we ever simulate them dynamically (same ODE shape, no geometry)

None of these need contact detection between arbitrary bodies, and nothing on the
roadmap does. If a future sim genuinely needs free 2D rigid-body contact (a tumbling
box), that is a new decision point, not a stretch of this engine.

**What Tier 1 buys over Tier 0, concretely:** correct event localization (a guard
crossing is found by root-finding inside the step, not detected one tick late),
impulsive reset maps done once (string jerk, collisions, stiction capture), a
deterministic fixed-timestep clock shared by every sim, and one tested integrator
instead of N hand-rolled ones.

### 1.1 The engine is half the story (flagged, not specced here)

In the shipped Atwood sim, the dynamics are ~30 lines; the other ~900 are scene
rendering, controls, plots, FBD arrows, tooltips, accessibility, and telemetry. That
surface will be duplicated per sim and is the larger authoring cost. A sibling
**sim-kit spec** (shared canvas scene helpers, slider+number controls, live plots, FBD
arrow renderer, telemetry emitter, reduced-motion handling) should follow this one.
This spec deliberately excludes all of it: **the engine computes trajectories and
observables; it never touches the DOM or canvas.**

## 2. Core model

A sim hands the engine a **model**; the engine returns a stepped **trajectory** plus an
**event log**.

```
Model
  state:       named coordinates and velocities, e.g. { x: 0, v: 0 }
  params:      named constants, e.g. { M, m, theta, I, r, mu_k, b }
  modes:       at least one; exactly one active at a time
    derivatives(state, params) -> named time-derivatives
    guards: [ { crossed(state, params) -> signed number,   // root of this ends the mode
                target: modeName,
                reset(state, params) -> state } ]           // optional impulsive map
  observables: named pure functions of (state, params, mode),
               e.g. tensionCart, tensionHang, KE, PE, E_dissipated
```

- **Minimal coordinates.** The Atwood machine is one coordinate `d` (string
  displacement) regardless of how many bodies move. Constraints are baked into the
  derivative expressions by the model author, where they are legible physics
  (`a = g(m - M sin theta) / (M + m + I/r^2)`), not solved numerically.
- **Modes are the hybrid part.** Taut vs slack string, static vs kinetic friction,
  in-flight vs landed. A guard is a scalar function whose zero crossing (with sign
  direction) ends the mode; the engine bisects the crossing time to tolerance inside
  the step, applies the reset map (if any), and continues in the target mode. This is
  the standard hybrid-automaton framing and it is exactly the machinery the
  spring-Atwood "periodic slack and bounce" regime needs.
- **Observables are first-class.** Tooltips, FBD arrows, results panels, and telemetry
  all read named observables instead of re-deriving physics in UI code. This also
  answers the pulley-inertia subtlety: with pulley moment of inertia I, the two string
  tensions differ (their difference torques the pulley), so `tensionCart` and
  `tensionHang` are two observables, not one `T`.
- **Energy accounting is mandatory (decided).** Every model exposes `KE`, `PE`, and
  `E_dissipated` observables from day one, plus a derived `E_total = KE + PE +
E_dissipated` that the engine can assert is conserved to tolerance in conservative
  modes (a built-in correctness check, and the reason to make it universal rather than
  per-sim). Cheap to write alongside the dynamics; expensive to retrofit once several
  sims exist. The AI layer reads these to reason about where a student's energy
  intuition breaks.

### 2.1 Integrator

- **Fixed timestep, RK4, accumulator pattern** (same accumulator/speed-multiplier
  contract the Atwood sim already uses; dt stays 0.01 s by default).
- Guard functions are checked each step; on a sign change the engine bisects to a time
  tolerance (~1e-6 s), advances exactly to the event, applies the reset, and resumes.
- **Determinism is a hard requirement:** no wall-clock or randomness inside the engine;
  identical (model, dt, initial state) yields an identical trajectory and event log on
  every machine. This is what makes trajectories testable, telemetry replayable for the
  AI layer, and per-student randomized givens (envelope seed slot already reserved)
  auditable later.
- **Accuracy (decided):** the engine integrates accurately (RK4 collapses the
  Euler-era ~1% a_measured/a_theoretical gap to ~1e-6). The pedagogical percent-error
  gap is preserved deliberately, but as an **explicit, seeded measurement-noise layer on
  top of the trajectory, never inside the integrator** (Section 2.1.1). The shipped
  Atwood sim's Euler discretization error is an accident of the integrator; a seeded
  noise model is a physics-honest, reproducible, and gradeable replacement.

#### 2.1.1 Measurement-noise layer (decided)

The engine produces exact trajectories; a separate, opt-in noise layer perturbs only the
values a student would **read off an instrument**, leaving the underlying dynamics clean.

- **Seeded and deterministic.** The layer takes an explicit integer `seed`; same seed and
  model yield identical perturbed readings on every machine. The seed slot already
  reserved in the answer envelope (per-student randomized givens) is the natural source,
  so a grader can reproduce exactly what a given student saw.
- **Perturbs observations, not state.** Noise is applied when an observable is _sampled
  for display or telemetry_ (the reported t, d, v_f, and thus a_measured), never fed back
  into `derivatives`. The trajectory a replay reconstructs is the clean one; the readings
  are the noisy ones. This keeps energy accounting and mode guards exact.
- **Model declares the noise, not the engine.** Each observable may carry an optional
  noise descriptor (e.g. `{ kind: 'gaussian', relative: 0.01 }` or an absolute
  quantization step for a simulated digital readout). Sims with no descriptor read exact
  values. Default for the PH 201 Atwood port: a small relative Gaussian on the timing
  readout sized to reproduce the current ~1% percent-error feel.
- **A pure function of (cleanValue, seed, sampleIndex).** No global RNG state; the
  `sampleIndex` (or event id) makes each reading independently reproducible regardless of
  render framerate.

### 2.2 Worked example: spring-Atwood slack mode (the motivating case)

Spring (constant k, rest length L0) from wall anchor to incline block; string from block
over pulley to hanging mass.

- **Mode `taut`** (1 DOF, coordinate d): string inextensible, bodies share
  acceleration; observable `tensionHang = m (g - a)`.
  Guard: `tensionHang` crossing zero from above (string cannot push) -> `slack`.
- **Mode `slack`** (2 DOF: block position, hanging mass position): block oscillates on
  the spring alone; hanging mass is a free faller.
  Guard: string length returning to its natural value (relative displacement crossing
  zero) -> `taut`, with reset map: inelastic jerk to a common along-string velocity via
  momentum conservation with the effective masses (and I/r^2 if the pulley has inertia).
  Observable `E_dissipated` increments by the jerk loss, so energy accounting stays
  honest.

The whole failure regime the user described is two modes, two guards, one reset map.
That is the engine's whole job; the animation on top is unchanged rendering of body
positions.

## 3. Where the code lives (decided)

Constraint: custom sims are standalone static HTML under `public/`, no build step, no
imports from the app bundle (locked in the Atwood handoff, and worth keeping: sims stay
trivially sandboxable and testable by opening a file).

**Decided: `public/sims/lib/engine/` as dependency-free, JSDoc-typed vanilla ES
modules.** Sims import via `<script type="module">` with a relative path. No build step.

- Type safety without a build step: JSDoc annotations checked by `tsc` (`checkJs` over
  that directory, wired into `npm run typecheck`).
- Unit-testable: Vitest imports the same files directly; the engine is pure math, so it
  is prime Stryker mutation-audit territory once stable (same rationale as
  canonicalize/leastSquares in `stryker.config.json`).
- Versioning: engine and sims ship from the same repo and deploy together, so no semver
  ceremony; breaking changes are a grep across `public/sims/*/index.html`. A comment
  header documents the module contract.

Rejected alternative (author in TS under `src/sim-engine/`, emit a static bundle into
`public/sims/lib/` via a tiny esbuild step): nicer types, but it introduces the build
step the sim architecture explicitly avoided, plus a generated-artifact-in-git or
build-order problem. Revisit only if JSDoc typing proves too weak in practice.

## 4. Physics roadmap the engine must not preclude

Ordered roughly by expected need; none require engine surface beyond Section 2:

1. **Pulley moment of inertia** (Atwood, even frictionless): effective inertia
   `M + m + I/r^2`, split tensions as observables. Parameter, not a mode.
2. **Static/kinetic friction:** `moving` mode with `mu_k N` opposing velocity; `stuck`
   mode (zero velocity) with breakaway guard `|F_required| > mu_s N`; stiction capture
   guard on velocity zero-crossing when the applied force cannot sustain motion.
3. **Linear and quadratic drag:** extra derivative terms `-b v` / `-c v |v|`; terminal
   velocity falls out and is a good analytic test.
4. **Springs:** Hooke terms; enables oscillators and the spring-Atwood sim.
5. **Slack/taut string transitions:** Section 2.2.
6. **1D collisions:** guard on position coincidence, reset map with restitution e.
7. **Driven systems:** time enters as an explicit state coordinate (t' = 1), so
   sinusoidal driving needs no special casing.

## 5. Telemetry: the engine event log (decided)

The AI layer gets the engine's mode-transition log, beyond the sim-level `trial_*`
events the Atwood sim already emits. The engine surfaces every mode transition and every
guard-triggered reset; the sim forwards them to the parent via the existing
`labframe:sim-event` postMessage channel under a new reserved shape:

```
engine_event: {
  type: 'engine_event',
  event: 'mode_enter' | 'mode_exit' | 'guard_fired' | 'reset_applied',
  from,            // mode name (for exit/transition), optional
  to,              // mode name (for enter/transition), optional
  guard,           // guard name that fired, optional
  sim_t,           // simulation time of the event (seconds, exact, post-bisection)
  observables,     // snapshot of named observables at the event (incl. energy terms)
  t,               // wall-session time, same basis as existing events
}
```

- **Reserve the shape now** even though the AI layer is out of scope, so the schema is
  correct from day one (same discipline as the Atwood sim's telemetry).
- **The engine emits into an in-memory log; the sim decides what to postMessage.** The
  engine never calls `postMessage` itself (it is DOM-free). A sim may forward all engine
  events, throttle them, or drop them; the reference Atwood port forwards mode
  transitions and resets but not per-step samples.
- **Deterministic and replayable.** Because the trajectory and event times are
  deterministic (Section 2.1), the event log reconstructs identically from
  (model, seed, dt), so the AI layer can replay a student session exactly.

## 6. Testing strategy

The engine ships with its own test suite before any sim consumes it:

- **Analytic goldens:** frictionless incline-Atwood closed form (also cross-validates
  the shipped sim), small-angle pendulum period, terminal velocity under linear drag,
  spring-mass period, projectile range without drag.
- **Property tests (fast-check, already a dev dependency):** `E_total` conserved to
  tolerance in conservative modes across random parameters (uses the mandatory energy
  observables directly); energy monotonically non-increasing with friction/drag; event
  times found by bisection are consistent under dt refinement; determinism (two runs,
  identical trajectories and identical engine event logs); the seeded noise layer is
  reproducible (same seed -> identical readings) and leaves the clean trajectory
  untouched.
- **Mode-switch cases:** stiction capture and breakaway at the analytic threshold;
  slack-string jerk conserves momentum and loses the predicted energy; no chattering
  at grazing crossings (policy decided in E1, see Section 9).
- **Migration validation:** port the Atwood sim to the engine and assert the engine
  trajectory matches the current closed form within integrator tolerance at all three
  angle regimes plus the near-equilibrium 20 s cap.

## 7. Non-goals

- 2D rigid-body contact/collision detection, broadphase, contact manifolds, 3D.
- A general constraint solver (constraints are hand-reduced into minimal coordinates by
  the model author; that is a feature, the derivations ARE the physics content).
- Rendering, DOM, controls, telemetry transport (sim-kit spec territory).
- Soft bodies, fluids, fields as dynamical systems.
- Replacing PhET sims; this is only for LabFrame-authored sims.

## 8. Phasing

**Engine-first (decided).** The next builds are dynamics-heavy, so the engine leads; the
sim-kit extraction (Section 1.1) waits until the second new sim begins.

1. **Phase E1:** engine core (state/modes/guards/resets, RK4, event bisection,
   mandatory energy observables, seeded measurement-noise layer, in-memory engine event
   log, determinism) + test suite. No sim changes.
2. **Phase E2:** port the Atwood sim onto the engine as the reference consumer, with the
   validation harness of Section 6. Behavior-preserving, with two intended changes: RK4
   replaces Euler (Section 2.1) and the preserved percent-error gap moves to the seeded
   noise layer (Section 2.1.1). Wire the `engine_event` telemetry shape (Section 5).
3. **Phase E3:** first genuinely new physics: pulley inertia + friction on the Atwood
   sim (parameters and one mode pair), proving the extension story.
4. **Phase E4 (separate spec):** spring-Atwood sim with slack mode; sim-kit extraction
   begins with this second new sim.

## 9. Decisions locked (2026-07-02)

1. **Integrator + accuracy:** RK4 (accurate to ~1e-6), with the pedagogical percent-error
   gap preserved as an explicit seeded measurement-noise layer on top of the trajectory,
   never inside the integrator. (Sections 2.1, 2.1.1)
2. **Home for the code:** JSDoc-typed dependency-free ES modules in
   `public/sims/lib/engine/`, no build step. (Section 3)
3. **Energy accounting:** universal from day one; every model exposes KE/PE/E_dissipated
   plus a conserved E_total used as a built-in correctness check. (Section 2)
4. **Engine event log in telemetry:** yes; reserve the `engine_event` postMessage shape
   now, emitted by the engine into an in-memory log and forwarded by the sim. (Section 5)
5. **Sequencing:** engine-first. (Section 8)

6. **Chatter control (decided in Phase E1):** strict-sign crossing rule plus a hard
   transition cap, instead of hysteresis or a minimum-dwell rule. A guard fires only
   when its value at the start of the (sub)step is strictly on the departing side, or
   exactly zero with the (sub)step ending strictly across the surface; a guard sitting
   at zero on mode entry therefore cannot re-fire from the surface itself, while a
   trajectory that leaves the surface and re-crosses within the same substep is still
   caught (otherwise tiny arcs tunnel silently). Genuine Zeno regimes (a restitution
   bounce settling to rest) exceed `maxTransitionsPerStep` (default 8) and throw
   loudly; the model author resolves them with a terminating mode. Rationale: dwell
   and hysteresis rules can silently skip legitimate transitions; the cap makes the
   modeling error loud instead. Corollary for authors: a reset that re-enters the same
   guard surface should place the state exactly on it (e.g. `y: 0` at a bounce), since
   bisection stops within `timeTol` past the crossing and the engine never snaps state.

7. **Noise descriptor vocabulary (decided in Phase E2):** two kinds cover the roadmap:
   `{ kind: 'gaussian', relative? , absolute? }` (additive, sigma = absolute or
   |value| \* relative) and `{ kind: 'quantize', step }` (deterministic digital
   readout). The Atwood "~1% feel" target is pinned as gaussian `relative: 0.005` on
   the timing readout: sigma on a_measured = 2d/t^2 is twice the sigma on t, giving
   the ~1 percent spread the Euler discretization used to produce by accident (now
   unbiased and seed-reproducible). New kinds are added only when a sim needs one.

### Deferred / still open

- **sim-kit spec** (Section 1.1): written when Phase E4 begins.
