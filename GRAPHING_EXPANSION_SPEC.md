# Graphing Utility — Expansion Spec

**Status:** Future work. v1 ships with linear + proportional fits only. Execute the phases below only when a specific lab needs the new fit type — not preemptively.

**Companion to:** `REBUILD_SPEC.md` (canonical design). This document is scoped to the fit/regression subsystem inside the chart rendering pipeline (`src/ui/primitives/Chart.tsx`, plus a future `src/services/math/` module).

---

## 1. Purpose

LabFrame's chart utility supports student-facing curve fitting on lab data. v1 covers the only two fit types Snell's Law needs. This spec describes how to expand the utility to cover the rest of the labs without re-importing the legacy `fitCalculations.js` complexity (Levenberg-Marquardt, mathjs equation parsing, custom Gaussian elimination, Ridge regression). The premise is that **every fit a physics lab is likely to need can be reduced to a closed-form linear regression via an appropriate variable transform.** A general-purpose numerical optimizer is not in scope for any phase below; if a future lab demands one, that is a separate design decision and should be argued from first principles, not retrofitted from this spec.

## 2. Non-goals

- Arbitrary user-typed equations ("custom" fits in legacy). Out of scope permanently.
- Numerical optimization libraries (`ml-levenberg-marquardt`, `mathjs`, etc.). Bundle bloat with no current use case.
- Multi-parameter polynomial fits beyond degree 2. If a lab needs a cubic, it is probably specified wrong.
- Weighted least squares (heteroscedastic data). Not currently needed; revisit if a lab introduces explicit per-point uncertainties.
- Bayesian fitting / MCMC / anything beyond frequentist OLS.
- Importing patterns from `physics-labs.up.railway.app/utils/fitCalculations.js`. Read it for product knowledge (which labs use which fits, what students saw on screen). Do not lift code.

## 3. v1 baseline (for context)

Already implemented when this spec executes:

- `linear`: y = m·x + b, ordinary least squares.
- `proportional`: y = m·x, zero-intercept least squares.
- Returned object: `{ slope, slopeStdErr, intercept?, interceptStdErr?, rSquared }`.
- All standard errors are **1σ** (one standard deviation, the standard error of the parameter estimate). The UI labels them with a literal "1σ" so there is no ambiguity.
- Live in `src/services/math/` (or wherever `linearLeastSquares` ended up at v1 time). Each fit is a pure function with no dependencies outside the Node/TS standard library.
- Unit-tested against scipy/numpy reference values hard-coded in the test file.

If any of the above is not true at the time you execute this spec, fix it first — these are preconditions, not aspirations.

## 4. Uncertainty convention

**All slope/intercept uncertainties returned by any fit function and displayed in the UI are 1σ.** No silent 2σ, no "95% CI" without explicit conversion. The UI labels every uncertainty with a literal "1σ" suffix in parentheses, e.g.:

```
Slope: 1.503 ± 0.024 (1σ)
Intercept: 0.012 ± 0.018 (1σ)
R²: 0.9982
```

Reasoning: students taking these labs are simultaneously learning error propagation and statistical conventions. Ambiguity here teaches bad habits. Explicit labeling is cheap and prevents the "I thought that was 2σ" bug report.

For derived quantities (e.g., n_A computed from the slope of a sin-sin plot), uncertainty propagates by standard first-order propagation: σ_f² = Σ(∂f/∂x_i)² · σ_xi². If the lab content displays a derived quantity with uncertainty, the renderer must propagate the 1σ slope error into the derived quantity's 1σ error and label it the same way.

Sig figs: round the uncertainty to 2 significant figures, then round the central value to the same decimal place. Standard physics convention. (e.g., 1.5034 ± 0.0237 → 1.503 ± 0.024.)

## 5. Phased expansion

Each phase is independent and can be implemented in isolation. Implement only the phase whose fit type is needed by an active lab. Do not implement a phase speculatively.

### Phase A — Log-linearizable fits

**Trigger:** A lab needs a power law (e.g., Coulomb's force-vs-distance, F ∝ 1/r²) or exponential decay (e.g., RC discharge, V(t) = V₀·e^(-t/τ)).

**Fit types to add:**

- `powerLaw`: y = a · x^b. Linearize by taking log of both sides: ln(y) = ln(a) + b·ln(x). Run linear regression on (ln(x), ln(y)). Recover a = exp(intercept), b = slope.
- `exponential`: y = a · e^(b·x). Linearize: ln(y) = ln(a) + b·x. Run linear regression on (x, ln(y)). Recover a = exp(intercept), b = slope.

**Uncertainty propagation under log transform:**

- σ_b (the exponent or rate) is just the slope std err in log space. Same number, same units.
- σ_a is *not* directly the intercept std err in log space, because a = exp(intercept). By first-order error propagation, σ_a ≈ a · σ_intercept. The fit function must do this conversion before returning — callers should never see log-space uncertainties leak through.

**Edge cases the fit function must handle:**

- Any non-positive y (and any non-positive x for power law) is undefined under log. Skip those rows with a console warning in dev. If fewer than 2 valid points remain, return null.
- The log transform changes the relative weighting of points (large-y points get compressed). This is a known limitation of linearization and is acceptable for a teaching tool. Document it in a comment, not in the UI.

**Testing:** unit tests with clean synthetic data (y = 3·x^2.5, y = 5·e^(0.3x)) against scipy.optimize.curve_fit reference values. Tolerances: relative error < 1e-6 for slope/exponent, < 1e-5 for the multiplicative coefficient.

### Phase B — Other linearizable transforms

**Trigger:** A lab needs a fit like inverse-square (F = k/r²) or inverse (V = k/I), where the model is linear in a transformed variable but neither log-log nor semi-log.

**Approach:** Add a generic `linearizable` fit kind that takes a `transform` descriptor — `{ x: 'identity' | 'log' | 'inverse' | 'inverseSquare', y: 'identity' | 'log' | 'inverse' }` — applies it to the data, runs linear regression, and reports back. This subsumes Phase A (power law = log/log, exponential = identity/log) but Phase A should be implemented first as named conveniences before generalizing.

**Schema impact:** the lab content's `fits[]` entry needs to carry transform metadata. Define it in `src/domain/schema/lab.ts` as a discriminated union:

```typescript
type Fit =
  | { id: 'linear'; label: string }
  | { id: 'proportional'; label: string }
  | { id: 'powerLaw'; label: string }
  | { id: 'exponential'; label: string }
  | { id: 'linearizable'; label: string; xTransform: ...; yTransform: ... };
```

Validate via Zod; reject unknown fit IDs at schema-load time, not at render time.

**Display:** the fit line on the chart is rendered in the *original* (untransformed) coordinates. Sample the fitted curve at ~50 points across the visible x range and connect them with a line. Do not render the fit as a 2-point segment — that only works for true linear fits.

### Phase C — Quadratic

**Trigger:** A lab genuinely needs y = a·x² + b·x + c and the linearization tricks don't apply (e.g., projectile motion height vs. time with both initial velocity and gravity unknown).

**Approach:** Closed form via the normal equations for a 3-parameter linear-in-parameters fit. Solve a 3×3 system with Cramer's rule or a hand-rolled LU decomposition — do *not* import a matrix library for a single 3×3 solve. Return all three coefficients with 1σ standard errors derived from the covariance matrix.

**Reference:** Bevington & Robinson, *Data Reduction and Error Analysis for the Physical Sciences*, ch. 7. The closed-form expressions are standard and short.

**Caution:** quadratic fits are easy to abuse — students will fit a parabola to anything and get a spurious R² ≈ 1. The chart UI should show the raw data prominently and the fit as a thin overlay; do not let the fit visually dominate the data.

### Phase D — Numerical optimization (only as a last resort)

**Trigger:** A lab requires a fit that genuinely cannot be linearized — for example, a sigmoid response, a sum of two exponentials with non-separable timescales, or a model with both additive and multiplicative parameters intertwined.

**Before implementing this phase, do all of the following:**

1. Write down the model algebraically and convince yourself it's not log-linearizable, not power-law-linearizable, and not reducible to a 2-parameter linear-in-parameters fit by any variable substitution.
2. Check whether the lab pedagogy actually requires the nonlinear fit, or whether a different lab design (different measured quantity, different parameter sweep) would let students use a closed-form fit.
3. Read the legacy `fitCalculations.js` Levenberg-Marquardt implementation as a *cautionary* reference — note the multi-start strategy, R² thresholds, parameter sanity checks. These are real concerns that any LM implementation has to handle, and the legacy's complexity reflects that.

**If after all that you still need LM:**

- Use a small, well-tested library — `ml-levenberg-marquardt` (~50KB) is a reasonable choice. Bundle cost is acceptable for one or two labs that need it.
- Restrict to a *named, validated* set of model functions in the schema (`expDecaySingle`, `expDecayDouble`, `sigmoid`, etc.). No user-typed equations.
- Always require an initial guess from the lab content. Do not run multi-start optimization; that's the legacy's anti-pattern. If the initial guess is wrong, the fit fails visibly and the student should re-examine their data, not have the optimizer flail.
- Compute parameter uncertainties from the covariance matrix at convergence (Jacobian → JᵀJ → invert → diagonal sqrt = 1σ standard errors). Do not rely on the library's reported errors without verifying the formula.
- If R² < 0.9 or any parameter's relative uncertainty exceeds 50%, surface a warning in the UI: "Fit may not be reliable — check data and model choice." The legacy silently shipped bad fits; this regression must not.

## 6. Uniform return type

Every fit function — present and future — returns the same shape:

```typescript
type FitResult = {
  // Primary parameters, in the natural units of the model.
  // For linear: slope = m, intercept = b in y = m·x + b.
  // For proportional: slope = m in y = m·x, intercept omitted.
  // For powerLaw: slope = exponent b, intercept = coefficient a in y = a·x^b.
  // For exponential: slope = rate b, intercept = amplitude a in y = a·e^(b·x).
  slope: number;
  slopeStdErr: number;       // 1σ
  intercept?: number;
  interceptStdErr?: number;  // 1σ
  rSquared: number;
  // For nonlinear fits (Phase D), additional named parameters go here:
  extraParams?: Record<string, { value: number; stdErr: number }>;
};
```

Returning `null` indicates the fit could not be performed (insufficient data, singular system, all-NaN inputs). The caller renders an empty plot with a "not enough data to fit" hint, not an error.

## 7. Display conventions

- The fit line is drawn in original-data coordinates, sampled at ≥50 points for any nonlinear fit. Linear fits can use 2 endpoints since they're straight in the rendered space.
- Color and stroke: same orange `#e66f00`, 2px, no markers — match the v1 linear fit so the visual language is consistent across fit types.
- The student-facing text summary appears below the plot:

  ```
  Fit: y = (1.503 ± 0.024) · x  (1σ)
  R² = 0.9982
  ```

  Format the equation in the natural form for that fit (e.g., for power law: `y = (3.012 ± 0.041) · x^(2.498 ± 0.013)`). Use Unicode minus sign for negative coefficients. Keep this text plain — no LaTeX, no MathML — so it copy-pastes cleanly into student notebooks.

- If the chart has no fit defined in the lab content, do not render fit summary text at all (do not show "no fit available"; just omit the section).

## 8. Schema validation

All fit IDs must be in the Zod enum at the schema layer. Adding a new fit requires:

1. Add the discriminator value to the `Fit` type union in `src/domain/schema/lab.ts`.
2. Add the implementation to `src/services/math/`.
3. Add the dispatch branch to `Chart.tsx`'s fit loop.
4. Add unit tests with reference values.
5. Add at least one lab that uses it (a fit type with no consumer is dead code — delete it).

Schema validation must reject unknown fit IDs at `validateLab()` time. Render-time fallback to "unsupported fit" warnings is the v1 behavior because the schema was permissive then; tighten it as part of this expansion.

## 9. Testing requirements

For every fit implemented:

- **Unit tests** (`tests/unit/fits.<fitname>.test.ts`):
  - Clean synthetic data with known parameters: assert recovered parameters match within `1e-6` relative tolerance.
  - Empty input: returns null.
  - Single point: returns null.
  - All-NaN input: returns null, no throw.
  - Pathological cases specific to the fit (e.g., for power law: a row with x=0; for exponential: a row with y<0).
  - Reference comparison: hard-code 3-5 results from `scipy.optimize.curve_fit` or `numpy.polyfit` and assert the implementation matches to 1e-6 relative.
- **Integration test** (`tests/unit/Chart.<fitname>.test.tsx`):
  - Mount a `Chart` component with a section configured for the fit, feed it a small dataset, assert the fit line dataset is present in the chart.js data prop.

The `verify:phase0` style of running a single self-contained DoD test per phase is a good pattern; consider adding `verify:graphing-phase-A`, etc., as you go.

## 10. What this spec deliberately does *not* prescribe

- **When to ship a phase.** Each phase is gated on a specific lab needing the fit. If after migrating all the legacy labs only Phase A is needed, Phases B/C/D never get implemented. That is the correct outcome.
- **The exact API of `linearizable` transforms.** Phase B has flexibility on how the transform descriptor is shaped. Pick the design that reads cleanly when the third lab needs it, not the one that's most general today.
- **Whether to surface fit results back into the lab state.** Currently the student reads slope+uncertainty off the plot and types them into the measurement field manually. Auto-filling those fields is a UX feature that intersects with the integrity model (was the value typed or auto-derived?) and should be designed separately. Do not bolt it on as part of expanding fit types.

---

## Appendix: Reference texts

- Bevington & Robinson, *Data Reduction and Error Analysis for the Physical Sciences*, 3rd ed. — closed-form OLS expressions, error propagation, χ² conventions.
- Taylor, *An Introduction to Error Analysis*, 2nd ed. — undergraduate-level error propagation; matches what students are being taught.
- Press et al., *Numerical Recipes*, ch. 15 — if Phase D is ever triggered, this is the textbook reference for nonlinear least squares done correctly.

## Appendix: Anti-patterns observed in legacy

Documented for posterity so future contributors don't reach for them:

- Multi-start optimization with random perturbations as a fallback for failed LM convergence. If the initial guess is wrong, the right answer is to fix the lab's initial guess, not to brute-force the parameter space.
- `console.log` instrumentation in the fit code path. Use a debug flag or a dev-only logger; do not leak optimization internals to the production console.
- Ridge regularization applied silently when the matrix is ill-conditioned. The student is told the fit succeeded, but the parameters are biased toward zero. Either the data supports a fit or it doesn't — don't paper over rank-deficient designs.
- `mathjs` for evaluating user-typed equations. Massive bundle cost, security surface (sandbox escapes are a recurring class of bug), and an open invitation for students to fit y = sin(cos(tan(x))) to their three data points.
- A single 3000-line `fitCalculations.js` file. Each fit type belongs in its own small module with its own test file.
