# N2L adjustable-angle Atwood machine -- build handoff

**Status:** ready to build
**Course:** PH 201 (algebra-based, no uncertainty, no Canvas integration)
**Branch from:** `main`

## Scope

Three deliverables in one PR:

1. **PH 201 course manifest** -- new course, one lab to start.
2. **N2L Atwood lab definition** -- worksheet wrapping the custom sim.
3. **Custom simulation** -- standalone HTML5 sim served from `public/`.

## What you are building

A self-contained HTML5 simulation of a cart on a variable-angle track connected via
string and pulley to a hanging mass, plus a LabFrame lab definition that wraps it in a
worksheet. The sim is the data source: students manipulate parameters, run trials, and
derive acceleration from kinematic output. It emits structured telemetry for a future
Socratic AI layer -- that layer is out of scope here, but the telemetry schema must be
correct from day one.

---

## Deliverable 1: PH 201 course manifest

**File:** `src/content/courses/ph201.course.ts`

```ts
import type { Course } from '@/domain/schema';

export const ph201Course: Course = {
  id: 'ph201',
  title: 'PH 201',
  storagePrefix: 'ph201',
  // No Canvas integration at this stage -- parentOriginAllowList omitted (defaults to []).
  labs: [{ ref: 'n2l-atwood', labNumber: 1, enabled: true, group: 'core' }],
};
```

**Wire up in `src/content/courses/index.ts`:** export `ph201Course`.

**Wire up in `src/app/Routes.tsx`:**

- Add `ph201Course` to the `courses` array.
- Add a `ph201` key to `labsByCourse` mapping `'n2l-atwood'` to the lab object.
- Import the lab at the top of the file alongside the other lab imports.

No `parentOriginAllowList`, no `telemetryEndpoint`, no `role` override (defaults to
`'academic'`).

---

## Deliverable 2: Lab definition

**File:** `src/content/labs/ph201/n2l-atwood.lab.ts`
**Export name:** `ph201N2lAtwoodLab`
**Export from:** `src/content/labs/index.ts`

```ts
simulations: {
  atwood: {
    title: 'Adjustable-Angle Atwood Machine',
    url: '/sims/atwood/index.html',
    sandbox: 'allow-scripts',
  },
},
```

Note: the `url` field currently uses `z.string().url()` (Zod's absolute-URL validator),
which rejects root-relative paths. See schema changes below.

### Sections

1. **Introduction (given callout):** `kind: 'instructions'`. State the setup: frictionless
   track, massless string and pulley. Give the acceleration formula in plain text:
   `a = g(m - M sin(theta)) / (M + m)` using `g = 9.8 m/s^2`. Direct students to set
   their parameters in the simulation pane before recording predictions.

2. **Prediction table:** `kind: 'dataTable'`, `tableId: 'predictionTable'`, `rowCount: 3`.

   The schema has no mechanism to pre-populate cells. Precede the table with an
   `instructions` block listing the suggested parameter combos:

   > **Trial 1 -- vary m:** M = 0.5 kg, theta = 0 deg. Choose two values of m.
   > **Trial 2 -- vary M:** m = 0.1 kg, theta = 0 deg. Choose two values of M.
   > **Trial 3 -- vary theta:** M = 0.5 kg, m = 0.2 kg. Choose two angles.

   Students transcribe the parameters they actually use into the table before running.

   Columns:

   ```ts
   [
     { id: 'trial', label: 'Trial', kind: 'input' },
     { id: 'M_pred', label: 'M (kg)', kind: 'input', unit: 'kg' },
     { id: 'm_pred', label: 'm (kg)', kind: 'input', unit: 'kg' },
     { id: 'theta_pred', label: 'theta (deg)', kind: 'input', unit: 'deg' },
     { id: 'a_pred', label: 'Predicted a', kind: 'input', unit: 'm/s^2' },
   ];
   ```

3. **Data table:** `kind: 'dataTable'`, `tableId: 'dataTable'`, `rowCount: 3`.
   `a_theoretical` is a derived column -- auto-computes once M, m, theta are entered.
   Percent error is an input column (PHY 114 / PH 201 pedagogy: student computes it).

   Columns:

   ```ts
   [
     { id: 'trial', label: 'Trial', kind: 'input' },
     { id: 'M', label: 'M (kg)', kind: 'input', unit: 'kg' },
     { id: 'm', label: 'm (kg)', kind: 'input', unit: 'kg' },
     { id: 'theta', label: 'theta (deg)', kind: 'input', unit: 'deg' },
     { id: 'a_measured', label: 'a_measured (m/s^2)', kind: 'input', unit: 'm/s^2' },
     {
       id: 'a_theoretical',
       label: 'a_theoretical (m/s^2)',
       kind: 'derived',
       formulaLabel: 'g(m - M sin(theta)) / (M + m)',
       deps: ['M', 'm', 'theta'],
       precision: 3,
       formula: (row) => {
         const g = 9.8;
         const M = row['M'] ?? 0;
         const m = row['m'] ?? 0;
         const theta = row['theta'] ?? 0;
         if (M + m === 0) return 0;
         return (g * (m - M * Math.sin((theta * Math.PI) / 180))) / (M + m);
       },
     },
     { id: 'pct_error', label: 'Percent error (%)', kind: 'input', unit: '%' },
   ];
   ```

4. **Analysis questions:** Four `kind: 'concept'` sections:
   - "In Trial 1, what happened to acceleration as hanging mass increased? Explain using
     Newton's second law."
   - "In Trial 2, what happened to acceleration as cart mass increased? Why?"
   - "Describe what angle setting would cause the cart to remain stationary. Write the
     equation that relates M, m, and theta at that condition."
   - "A student claims that doubling the hanging mass always doubles the acceleration.
     Is this correct? Explain."

5. **Concept check (warning callout):** One `kind: 'concept'` section, preceded by an
   `instructions` block styled as a warning callout (follow the pattern in nearby labs):
   "If you increase both M and m by the same amount, does acceleration increase,
   decrease, or stay the same? Predict first, then test it in the simulation."

---

## Deliverable 3: Custom simulation

**File:** `public/sims/atwood/index.html`

Self-contained HTML + vanilla JS. No build step, no external dependencies, no import of
LabFrame modules. The file is served as a static asset by Vite in dev and by Vercel in
production. It loads in the existing `<iframe>` in `LabPage.tsx` exactly like any PhET
sim, just with a local URL.

### Why standalone HTML

- Zero coupling to the app's React/Vite bundle and routing.
- Trivially testable by opening the file directly in a browser.
- Sandboxable via the iframe `sandbox` attribute (see schema changes below).
- Future custom sims follow the same pattern: drop a folder under `public/sims/`.

### Physics model

```
a = g * (m - M * sin(theta)) / (M + m),  g = 9.8 m/s^2
```

Frictionless throughout. Fixed geometry:

- Track length: 1.5 m (cart travel distance from rest to pulley end)
- Hanging mass drop height: 1.2 m

Trial ends when the cart reaches the pulley end or the hanging mass reaches the floor,
or when sim time reaches 20 s (near-equilibrium cap) -- whichever comes first.

Special cases students can discover:

- `theta = 0`: horizontal track, classic F = ma demo
- `theta = 90`: vertical, classic Atwood machine
- `m = M * sin(theta)`: equilibrium, a = 0

### Integrator

Fixed-timestep Euler with accumulator pattern:

- `dt = 0.01 s` per step (deterministic, display-framerate-independent)
- Each `requestAnimationFrame` callback accumulates wall-clock delta and steps as many
  times as needed
- Cap accumulated delta at `dt * 10` to prevent spiral-of-death after tab switching

All sliders and inputs are **locked** while a trial is running. Unlock on Pause or
Reset. This prevents mid-trial parameter changes that would make recorded t and d
meaningless.

### Canvas scene

The scene is a 2D canvas that redraws every frame. All coordinates are in world units
(meters) and transformed to canvas pixels via a fixed scale and margin.

**Static elements (always visible, update when parameters change):**

- **Wall:** vertical line at the left edge with hatch marks -- the track pivot mount.
- **Track:** line from the pivot pin (lower-left) to the pulley position at angle
  `theta`. Rotates smoothly when the angle slider changes outside a trial.
- **Pivot pin:** small filled circle at the track's lower-left anchor.
- **Pulley:** circle at the upper end of the track with 4--6 spokes. **Rotates** as the
  string moves during a trial; rotation angle tracks cumulative string displacement.
- **Cart:** rectangle sitting flush on the track, **rotated to match `theta`**
  (not axis-aligned). Labeled with the current `M` value (small text, centered).
- **String:** two segments -- (1) from the cart's uphill face to the pulley center,
  (2) from the pulley center straight down to the hanging mass. Both segments update
  every frame as the cart moves.
- **Hanging mass:** rectangle below the pulley, labeled with current `m` value.
- **Floor:** horizontal line with hatch marks below the hanging mass. Positioned at the
  hanging mass's terminal drop position (1.2 m below pulley). Makes the "hits the
  ground" termination condition visible before the trial starts.

**Dynamic elements (active during and after a trial):**

- **Motion trail:** smooth bezier path (not dots) tracing the cart's position along the
  track. Drawn with a gradient from transparent to the trail color, fading as it ages.
  Clears on Reset.
- **Live readouts overlay:** positioned in the upper-left of the canvas during a trial --
  elapsed time `t` (s), distance `d` (m), instantaneous velocity `v` (m/s). Updates
  every frame.
- **Trial-complete highlight:** when the trial ends, the results panel animates in with
  a brief fade/scale; the final `a_measured` value counts up over ~0.5 s to draw the
  eye.

**Hover tooltip (always active):**

When the mouse is within 20 px of the cart or hanging mass, show a small floating
tooltip with instantaneous physics values:

- Cart: `v = X.XX m/s`, `a = X.XX m/s^2`, `KE = X.XX J`
- Hanging mass: `v = X.XX m/s` (same magnitude, opposite direction), `KE = X.XX J`

Tooltip disappears when the mouse moves away. Works during a running trial and when
paused.

### Force diagram overlay (FBD toggle)

A **"Forces" toggle button** above or beside the canvas shows/hides a live free-body
diagram drawn directly on top of the scene. When active, draw on every frame:

**On the cart:**

| Vector                       | Direction                                 | Label               |
| ---------------------------- | ----------------------------------------- | ------------------- |
| Weight component along track | down the slope (negative track direction) | `Mg sin(theta)`     |
| Normal force                 | perpendicular to track, away from surface | `N = Mg cos(theta)` |
| Tension                      | up the slope (toward pulley)              | `T`                 |
| Net force                    | along track (up-slope when a > 0)         | `F_net`             |

**On the hanging mass:**

| Vector    | Direction                | Label   |
| --------- | ------------------------ | ------- |
| Weight    | straight down            | `mg`    |
| Tension   | straight up              | `T`     |
| Net force | straight down when a > 0 | `F_net` |

Arrow length scales linearly with force magnitude, anchored to the center of each body.
Use a consistent scale (e.g., 1 N = 8 px) so forces are visually comparable across
parameter changes. Arrows update every frame so they animate during the trial.

Color code: weight components in one color (e.g., orange), tension in another (e.g.,
blue), net force in a third (e.g., green). Labels sit at the arrowhead, offset to avoid
overlap.

At `theta = 0` the along-track weight component vanishes (correct -- no label needed).
At equilibrium `T = mg = Mg sin(theta)` and `F_net = 0` on both bodies; net force
arrows collapse to zero length (show as a dot or omit the arrowhead).

The FBD toggle state persists across trials (does not reset on Reset).

### Controls (below the canvas)

- Slider + numeric input for each of `M`, `m`, `theta`. Locked during a running trial;
  re-enabled on Pause or Reset.
- **Run / Pause / Reset** buttons.
  - Run is disabled when `a <= 0`. Show an inline message:
    "Hanging mass cannot accelerate the cart at this angle."
  - **Step** button (shown only when paused mid-trial): advance exactly one integrator
    tick (`dt = 0.01 s`). Lets students watch the graph and readouts update one frame
    at a time.
  - Reset clears the trail, resets position to origin, clears the graph, re-enables
    sliders.
- **Speed multiplier:** 0.25x / 0.5x / 1x toggle, default 0.5x. Scales the number of
  integrator steps per frame (not `dt` itself), keeping `a_measured = 2d / t^2`
  accurate at any speed.
- **Forces toggle:** show/hide the FBD overlay. Default off.

### Measurement output (shown after trial completes)

Results panel below the controls:

1. Time elapsed: `t` (s)
2. Distance traveled by cart: `d` (m)
3. Instantaneous velocity at end: `v_f` (m/s)
4. Measured acceleration (labeled "from your data"): `a_measured = 2d / t^2`

Do not show theoretical acceleration here. It appears in the data table only after the
student has typed their percent error -- preserving the prediction-and-compare loop.

### Live graphs

Two stacked mini-plots rendered on a second canvas (or with SVG) directly below the
results panel. Both update every frame during a trial and persist after completion.
Clear on Reset.

**Plot 1 -- Position vs. time:**

- x-axis: time (s), auto-scales to current trial duration, max 20 s
- y-axis: cart displacement along track (m), 0 to 1.5 m
- Curve: smooth line, drawn point-by-point as the trial runs
- After trial: curve is complete and static; a dashed line marks the terminal position
- Visual note: the parabolic shape is the geometric proof of `d = at^2 / 2`; label the
  curve "x(t)" in the plot legend

**Plot 2 -- Velocity vs. time:**

- x-axis: same time axis as Plot 1 (synchronized scale)
- y-axis: speed (m/s), 0 to v_max (auto-scales after first frame)
- Curve: smooth line; should appear linear -- slope = a
- After trial: add a dashed best-fit line and label its slope as `slope = a_measured`
  (computed from the final a_measured value, not a separate regression)
- Visual note: the linear slope is the direct visual confirmation that a is constant

Both plots share an x-axis scale so time alignment is obvious. Grid lines at round
intervals. Axis labels and units shown. No interactive zoom needed.

### Accessibility

- All controls keyboard-navigable.
- Each slider has `aria-label` including current value and unit
  (e.g. `"Cart mass, 0.5 kilograms"`).
- A visually-hidden `<div aria-live="polite">` summarizes current parameters for screen
  readers, updated on each parameter change.
- Respects `prefers-reduced-motion`: skip to end-state immediately on Run,
  show final readouts and complete graphs without animation.
- Force vectors in the FBD use both color and label (not color alone) for
  accessibility.

### Telemetry

The sim sends events to LabFrame via `window.parent.postMessage`. CustomEvent bubbling
does not cross iframe boundaries even same-origin, so postMessage is the correct channel.

```js
function emit(detail) {
  window.parent.postMessage({ type: 'labframe:sim-event', detail }, window.location.origin);
}
```

Capture `const sessionStart = performance.now()` once on page load; `t` in each event
is `(performance.now() - sessionStart) / 1000`.

Event shapes (document as JSDoc in the HTML file):

```
parameter_set:    { type, param: 'cart_mass'|'hanging_mass'|'angle', value, t }
trial_started:    { type, M, m, theta, t }
trial_completed:  { type, M, m, theta, duration, distance, a_measured, a_theoretical,
                    near_equilibrium, t }
trial_reset:      { type, t }
measurement_recorded: { type, field, value, t }
```

`near_equilibrium` is `true` when `|a_theoretical| < 0.05 m/s^2`. When true, show a
temporary popover anchored to the canvas: "Balanced!" (dark bg, white text, no icon,
dismisses after 2 s or on any parameter change). This is a telemetry debug aid and will
be removed once the AI layer is verified.

`a_theoretical` is included in `trial_completed` for the AI layer -- it is not surfaced
to the student in the sim.

---

## Schema and component changes required

### 1. `src/domain/schema/lab.ts` -- relax sim URL, add sandbox

```ts
export const SimulationSchema = z.object({
  url: z.string().url().or(z.string().startsWith('/')), // allow root-relative local paths
  title: nonEmptyText,
  allow: z.string().min(1).optional(),
  sandbox: z.string().min(1).optional(), // e.g. 'allow-scripts'
});
```

### 2. `src/ui/LabPage.tsx` -- pass sandbox to iframe

```ts
type SimulationFrameProps = {
  simulationId: string;
  title: string;
  url: string;
  allow?: string;
  sandbox?: string;           // add
};

function StableSimulationFrame({ simulationId, title, url, allow, sandbox }: SimulationFrameProps) {
  const mountId = useRef(`${simulationId}-${Math.random().toString(36).slice(2, 10)}`);
  return (
    <iframe
      title={title}
      src={url}
      allow={allow}
      sandbox={sandbox}       // add; undefined = no sandbox attribute (existing PhET behavior unchanged)
      loading="lazy"
      className="simulation-frame"
      data-mount-id={mountId.current}
    />
  );
}
```

And at the call site, spread `sandbox` alongside `allow`:

```ts
<StableSimulationFrame
  key={activeSimulationId}
  simulationId={activeSimulationId}
  title={activeSimulation.title}
  url={activeSimulation.url}
  {...(activeSimulation.allow ? { allow: activeSimulation.allow } : {})}
  {...(activeSimulation.sandbox ? { sandbox: activeSimulation.sandbox } : {})}
/>
```

**Existing PhET sims are unaffected** -- they have no `sandbox` field, so the attribute
is omitted and their behavior is unchanged.

---

## Parameters

| Parameter    | Symbol | Range       | Default | Step | Unit |
| ------------ | ------ | ----------- | ------- | ---- | ---- |
| Cart mass    | M      | 0.2 -- 2.0  | 0.5     | 0.1  | kg   |
| Hanging mass | m      | 0.05 -- 0.5 | 0.1     | 0.05 | kg   |
| Track angle  | theta  | 0 -- 60     | 0       | 1    | deg  |

Parameters are locked while a trial is running.

---

## Verification

Run `npm run verify:lab -- n2l-atwood` before opening the PR. Also confirm manually:

- No LaTeX leaks in PDF export (write equations as plain text: `g(m - M sin(theta)) /
(M + m)`, not `\frac{...}{...}`).
- No `unit: 'Symbol(unevaluable)'` in any table column.
- PDF export renders all sections including both data tables.
- `/sims/atwood/index.html` loads standalone (no LabFrame chrome) -- visit it directly
  in dev.
- Sim runs at all three angle extremes (0, 30, 60 deg) without visual artifacts.
- Equilibrium condition disables Run and shows the "Balanced!" popover.
- `prefers-reduced-motion` path works: set in devtools, click Run, confirm instant
  result.
- Typecheck passes: `npm run typecheck` (the new `sandbox` field must be reflected in
  the inferred `Simulation` type used in `LabPage.tsx`).
- PH 201 catalog route (`/c/ph201`) renders the N2L Atwood card.

---

## Out of scope for this build

- Canvas / LMS integration
- Socratic AI layer or hint system
- Friction, string mass, or pulley inertia
- Multiple pulley configurations
- Replay or video export
- Per-student parameter randomization (seed field reserved but not used)
- New section kinds (`kind: 'inlineSim'` or similar)

---

## Files to create / modify

| Action | Path                                                                      |
| ------ | ------------------------------------------------------------------------- |
| Create | `public/sims/atwood/index.html`                                           |
| Create | `src/content/courses/ph201.course.ts`                                     |
| Create | `src/content/labs/ph201/n2l-atwood.lab.ts`                                |
| Edit   | `src/content/courses/index.ts` -- export `ph201Course`                    |
| Edit   | `src/content/labs/index.ts` -- export `ph201N2lAtwoodLab`                 |
| Edit   | `src/app/Routes.tsx` -- add course, lab, and `labsByCourse.ph201`         |
| Edit   | `src/domain/schema/lab.ts` -- relax `SimulationSchema.url`, add `sandbox` |
| Edit   | `src/ui/LabPage.tsx` -- add `sandbox` prop to `StableSimulationFrame`     |

## Relevant files to read before starting

- `docs/AUTHORING_A_LAB.md` -- full lab authoring steps
- `src/content/labs/ph201/` -- (this directory is new; see `phy114/` for style reference)
- `src/content/courses/phy114.course.ts` -- course manifest style reference
- `src/domain/schema/lab.ts` -- Zod schemas
- `src/domain/schema/course.ts` -- `CourseSchema` and `CourseLabRefSchema`
- `src/services/pdf/markdown/latexToUnicode.ts` -- safe math notation for PDF
- `src/app/Routes.tsx` -- course + lab registration
- `src/ui/LabPage.tsx` -- iframe rendering of `lab.simulations`
