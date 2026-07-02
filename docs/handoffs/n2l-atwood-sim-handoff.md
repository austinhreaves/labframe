# N2L adjustable-angle Atwood machine -- build handoff

**Status:** ready to build  
**Course:** PHY 114 (algebra-based, no uncertainty)  
**Branch from:** `main`

## What you are building

A self-contained HTML5 simulation of a cart on a variable-angle track connected via
string and pulley to a hanging mass, plus a LabFrame lab definition that wraps it in a
worksheet. The sim is the data source: students manipulate parameters, run trials, and
derive acceleration from kinematic output. It emits structured telemetry for a future
Socratic AI layer -- that layer is explicitly out of scope here, but the telemetry schema
must be correct from day one.

## Physics model

Cart mass `M` on a frictionless track at angle `theta`. String over a massless frictionless
pulley connects the cart to hanging mass `m`.

```
a = g * (m - M * sin(theta)) / (M + m)
```

Frictionless throughout (no string mass, no pulley inertia, no air resistance). Motion
clamps at track endpoints; a trial ends when the cart reaches the pulley end or the
hanging mass hits the ground.

Special cases students can discover by exploring:
- `theta = 0`: horizontal track, classic F = ma demo
- `theta = 90`: vertical, classic Atwood
- `m = M * sin(theta)`: equilibrium (a = 0)

## Parameters

| Parameter   | Symbol | Range      | Default | Step | Unit |
| ----------- | ------ | ---------- | ------- | ---- | ---- |
| Cart mass   | M      | 0.2 -- 2.0 | 0.5     | 0.1  | kg   |
| Hanging mass| m      | 0.05 -- 0.5| 0.1     | 0.05 | kg   |
| Track angle | theta  | 0 -- 60    | 0       | 1    | deg  |

Parameters are locked while a trial is running. Changing any parameter after a trial
completes implicitly starts a new trial configuration.

## Simulation component

**File:** `src/content/labs/phy114/atwood-sim/AtwoodSim.tsx`  
**Type:** React component, no external physics or animation libraries. Use
`requestAnimationFrame` with a fixed timestep integrator.

### Canvas layout

- Track: line at angle `theta` from lower-left corner, pivoting about that corner.
  Rotates smoothly as angle slider changes (even outside a trial).
- Cart: rectangle on the track, labeled with current `M` value.
- Pulley: circle at the upper end of the track.
- String: from cart over pulley, drops vertically to hanging mass.
- Hanging mass: rectangle below pulley, labeled with current `m` value.
- Motion trail: fading dots along the cart path during a trial.
- Live readouts during trial: elapsed time (s) and cart distance traveled (m).

### Controls

Below the canvas:
- Slider + numeric input for each of `M`, `m`, `theta`. Numeric inputs accept typed
  values and clamp to range on blur.
- Run / Pause / Reset buttons. Run is disabled if `a <= 0` (hanging mass would not
  accelerate the cart at this angle -- show a short inline message explaining why).
- Speed multiplier: 0.25x / 0.5x / 1x toggle. Default 0.5x so motion is observable.

### Measurement output (shown after trial completes)

Display in a results panel below the controls:

1. Time elapsed: `t` (s)
2. Distance traveled by cart: `d` (m)
3. Measured acceleration (labeled "from your data"): `a_measured = 2d / t^2`

Do not show theoretical acceleration here. It is shown in the data table only after the
student has typed their percent error, preserving the prediction-and-compare loop.

### Accessibility

- All controls keyboard-navigable.
- Each slider has `aria-label` including current value and unit (e.g. "Cart mass, 0.5
  kilograms").
- Canvas has a visually-hidden `<div>` summarizing current parameters for screen readers,
  updated on each parameter change.
- Animation respects `prefers-reduced-motion`: skip to end-state immediately on Run,
  show final readouts.

## Telemetry schema

The sim dispatches `new CustomEvent('labframe:sim-event', { detail, bubbles: true })`
on the canvas element after each action. Detail is a tagged union:

```ts
type SimEvent =
  | { type: 'parameter_set';
      param: 'cart_mass' | 'hanging_mass' | 'angle';
      value: number; t: number }
  | { type: 'trial_started';
      M: number; m: number; theta: number; t: number }
  | { type: 'trial_completed';
      M: number; m: number; theta: number;
      duration: number; distance: number;
      a_measured: number; a_theoretical: number;
      near_equilibrium: boolean; t: number }
  | { type: 'trial_reset'; t: number }
  | { type: 'measurement_recorded';
      field: string; value: number; t: number }
```

`t` is seconds since the lab session was loaded (not wall clock).  
`near_equilibrium` is `true` when `|a_theoretical| < 0.05 m/s^2`. When this condition
is met, show a small popover anchored to the canvas reading "Balanced!" -- this is a
temporary telemetry debug aid, not permanent student-facing copy. Style it as a plain
tooltip (dark bg, white text, no icon) that dismisses after 2 seconds or on any
parameter change. It will be removed once the AI layer is wired and telemetry is
verified end-to-end.  
`a_theoretical` is included in `trial_completed` for the AI layer's use -- it is not
surfaced to the student until they have filled in percent error.

The sim does not import anything from the AI layer. Telemetry flows one way.

## Lab definition

**File:** `src/content/labs/phy114/n2l-atwood.lab.ts`  
**Export:** add to `src/content/labs/index.ts`  
**Enable:** add to PHY 114 course manifest with `enabled: true, group: 'core'`

### Sections

1. **Introduction callout (given):** Setup description and diagram reference. State that
   the track is frictionless and the string/pulley are massless.

2. **Simulation section:** Embeds `AtwoodSim`. No config overrides needed (use defaults).

3. **Prediction table:** Before each trial, student records their predicted acceleration.
   Columns: Trial, M (kg), m (kg), theta (deg), Predicted a (m/s^2). Three pre-seeded
   trial rows with suggested parameter combos that isolate one variable at a time:
   - Trial 1: vary m (M and theta fixed)
   - Trial 2: vary M (m and theta fixed)
   - Trial 3: vary theta (M and m fixed)
   Add a note: "Set your parameters to match each row before running."

4. **Data table:** Student fills in measured acceleration and percent error.
   Columns: Trial, M (kg), m (kg), theta (deg), a_measured (m/s^2),
   a_theoretical (m/s^2), Percent error (%).
   - `a_theoretical` is provided (auto-filled or shown in the header after trial
     completes -- either inline or as a reference value the student copies in).
   - Percent error is student-computed: `|(a_measured - a_theoretical)| / a_theoretical * 100`.
   No auto-compute for percent error.

5. **Analysis questions (free response):**
   - "In Trial 1, what happened to acceleration as hanging mass increased? Explain using
     Newton's second law."
   - "In Trial 2, what happened to acceleration as cart mass increased? Why?"
   - "Describe what angle setting would cause the cart to remain stationary. Write the
     equation that relates M, m, and theta at that condition."
   - "A student claims that doubling the hanging mass always doubles the acceleration.
     Is this correct? Explain."

6. **Concept check (warning callout):**
   "If you increase both M and m by the same amount, does acceleration increase,
   decrease, or stay the same? Predict first, then test it."

## Verification

Run `npm run verify:lab -- n2l-atwood` before opening the PR. Confirm:
- No LaTeX leaks in PDF export (no `\frac`, `\tag`, etc. -- write equations in plain
  text or Unicode).
- No `unit: 'Symbol(unevaluable)'` in any table column.
- PDF export renders all sections including the data table.
- Sim runs in the browser at all three angle extremes (0, 30, 60 deg) without visual
  artifacts.
- `prefers-reduced-motion` path works (set in browser devtools, click Run, confirm
  instant result).

## Out of scope for this build

- Socratic AI layer or any hint system
- Friction, string mass, or pulley inertia
- Multiple pulley configurations
- Replay or video export
- PhET-iO
- Instructor dashboard
- Per-student parameter randomization (seed field reserved in envelope schema but not
  used here)

## Relevant files to read before starting

- `docs/AUTHORING_A_LAB.md` -- full lab authoring steps
- `src/content/labs/phy114/` -- nearby labs for style reference
- `src/content/courses/phy114.ts` -- course manifest to enable the lab
- `src/domain/schema/lab.ts` -- Zod schema all lab definitions must satisfy
- `src/services/pdf/markdown/latexToUnicode.ts` -- what math notation is safe in PDF
