# Custom Sim Physics Engine - Spec

**Status:** Design only. No code in this pass. Written 2026-07-02.

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
- **Accuracy note for sign-off:** the shipped Atwood sim uses semi-implicit Euler and
  shows ~1% discretization gap between a_measured and a_theoretical, which currently
  gives students a small nonzero percent error even with perfect reading. RK4 collapses
  that gap to ~1e-6. Decide whether the pedagogical gap is a feature to preserve
  (e.g. by injecting a documented measurement quantization instead) or a bug to fix.
  The engine itself should be accurate; any "experimental noise" belongs in an explicit,
  seeded layer on top, never in the integrator.

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

## 3. Where the code lives (decision needed)

Constraint: custom sims are standalone static HTML under `public/`, no build step, no
imports from the app bundle (locked in the Atwood handoff, and worth keeping: sims stay
trivially sandboxable and testable by opening a file).

**Recommendation: `public/sims/lib/engine/` as dependency-free, JSDoc-typed vanilla ES
modules.** Sims import via `<script type="module">` with a relative path.

- Type safety without a build step: JSDoc annotations checked by `tsc` (`checkJs` over
  that directory, wired into `npm run typecheck`).
- Unit-testable: Vitest imports the same files directly; the engine is pure math, so it
  is prime Stryker mutation-audit territory once stable (same rationale as
  canonicalize/leastSquares in `stryker.config.json`).
- Versioning: engine and sims ship from the same repo and deploy together, so no semver
  ceremony; breaking changes are a grep across `public/sims/*/index.html`. A comment
  header documents the module contract.

Alternative (author in TS under `src/sim-engine/`, emit a static bundle into
`public/sims/lib/` via a tiny esbuild step): nicer types, but it introduces the build
step the sim architecture explicitly avoided, plus a generated-artifact-in-git or
build-order problem. Not recommended unless JSDoc typing proves too weak in practice.

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

## 5. Testing strategy

The engine ships with its own test suite before any sim consumes it:

- **Analytic goldens:** frictionless incline-Atwood closed form (also cross-validates
  the shipped sim), small-angle pendulum period, terminal velocity under linear drag,
  spring-mass period, projectile range without drag.
- **Property tests (fast-check, already a dev dependency):** energy conserved to
  tolerance in conservative modes across random parameters; energy monotonically
  non-increasing with friction/drag; event times found by bisection are consistent under
  dt refinement; determinism (two runs, identical trajectories).
- **Mode-switch cases:** stiction capture and breakaway at the analytic threshold;
  slack-string jerk conserves momentum and loses the predicted energy; no chattering
  (guard hysteresis or minimum-dwell rule, to be designed) at grazing crossings.
- **Migration validation:** port the Atwood sim to the engine and assert the engine
  trajectory matches the current closed form within integrator tolerance at all three
  angle regimes plus the near-equilibrium 20 s cap.

## 6. Non-goals

- 2D rigid-body contact/collision detection, broadphase, contact manifolds, 3D.
- A general constraint solver (constraints are hand-reduced into minimal coordinates by
  the model author; that is a feature, the derivations ARE the physics content).
- Rendering, DOM, controls, telemetry transport (sim-kit spec territory).
- Soft bodies, fluids, fields as dynamical systems.
- Replacing PhET sims; this is only for LabFrame-authored sims.

## 7. Phasing

1. **Phase E1:** engine core (state/modes/guards/resets, RK4, bisection, observables,
   determinism) + test suite. No sim changes.
2. **Phase E2:** port the Atwood sim onto the engine as the reference consumer, with
   the validation harness of Section 5. Behavior-preserving except the integrator
   accuracy decision (Section 2.1).
3. **Phase E3:** first genuinely new physics: pulley inertia + friction on the Atwood
   sim (parameters and one mode pair), proving the extension story.
4. **Phase E4 (separate spec):** spring-Atwood sim with slack mode; sim-kit extraction
   begins when the second new sim starts, not before.

## 8. Open questions for sign-off

1. **Integrator accuracy vs pedagogy** (Section 2.1): should a_measured match theory to
   float precision, or do we add an explicit seeded measurement-noise layer so percent
   error stays a meaningful exercise?
2. **Home for the code** (Section 3): accept the JSDoc-in-`public/` recommendation, or
   pay for a build step to author in TypeScript?
3. **Energy accounting as a universal observable:** should every sim expose KE/PE/
   E_dissipated from day one (cheap now, retrofit-annoying later)? The AI layer would
   likely want it.
4. **Does the AI layer want the engine event log** (mode transitions with timestamps)
   in telemetry, beyond the current trial\_\* events? If yes, the telemetry schema should
   reserve an `engine_event` shape now.
5. **Sequencing:** engine-first assumes the next sims are dynamics-heavy. If the next
   two sims are, say, optics ray diagrams, the sim-kit spec should jump the queue and
   this one waits for the spring-Atwood build.
