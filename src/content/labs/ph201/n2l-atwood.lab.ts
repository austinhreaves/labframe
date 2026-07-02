// PH 201 Lab 1: Newton's Second Law with an adjustable-angle Atwood machine.
//
// Wraps the custom standalone sim at public/sims/atwood/index.html (served as a
// static asset; loaded in the sim iframe like any PhET sim, just via a local
// root-relative URL). PH 201 is algebra-based: percent error only, no
// uncertainty or error propagation. Equations are written as plain text so
// nothing leaks as raw LaTeX in the PDF export.
// Build spec: docs/handoffs/n2l-atwood-sim-handoff.md
import type { Lab, NumericRow } from '@/domain/schema';

const G = 9.8;

export const ph201N2lAtwoodLab: Lab = {
  id: 'n2l-atwood',
  title: "Newton's Second Law: Adjustable-Angle Atwood Machine",
  description:
    'Use a simulated cart on a variable-angle track, connected over a pulley to a hanging mass, to test how acceleration depends on the two masses and the track angle.',
  category: 'Physics',
  simulations: {
    atwood: {
      title: 'Adjustable-Angle Atwood Machine',
      url: '/sims/atwood/index.html',
      sandbox: 'allow-scripts',
    },
  },
  sections: [
    {
      kind: 'instructions',
      tocLabel: 'Introduction',
      html: `## Introduction

A cart of mass M sits on a track that can be tilted from 0 to 60 degrees. A string runs from the cart, over a pulley at the top of the track, down to a hanging mass m. When released, the hanging mass pulls the cart up the track.

> [!NOTE]
> **Givens.** The track is frictionless, and the string and pulley are massless. With those assumptions, Newton's second law applied to both bodies predicts:
>
> a = g(m - M sin(theta)) / (M + m)
>
> where g = 9.8 m/s^2, M is the cart mass, m is the hanging mass, and theta is the track angle.

Set your parameters in the simulation pane on the left before recording each prediction. The sim reports elapsed time t and distance traveled d for each run; since the system starts from rest, the measured acceleration is a = 2d / t^2.`,
    },
    {
      kind: 'instructions',
      tocLabel: 'Predictions',
      html: `---

## Part 1: Predictions

You will run three trials, each varying one parameter while holding the other two fixed:

**Trial 1 - vary m:** M = 0.5 kg, theta = 0 deg. Choose two values of m.

**Trial 2 - vary M:** m = 0.1 kg, theta = 0 deg. Choose two values of M.

**Trial 3 - vary theta:** M = 0.5 kg, m = 0.2 kg. Choose two angles.

**Step 1.** Before running anything, record the parameters you plan to use in the table below, and compute a predicted acceleration for each trial using the formula from the introduction.`,
    },
    {
      kind: 'dataTable',
      tableId: 'predictionTable',
      rowCount: 3,
      columns: [
        { id: 'trial', label: 'Trial', kind: 'input' },
        { id: 'M_pred', label: 'M (kg)', kind: 'input', unit: 'kg' },
        { id: 'm_pred', label: 'm (kg)', kind: 'input', unit: 'kg' },
        { id: 'theta_pred', label: 'theta (deg)', kind: 'input', unit: 'deg' },
        { id: 'a_pred', label: 'Predicted a', kind: 'input', unit: 'm/s^2' },
      ],
    },
    {
      kind: 'instructions',
      tocLabel: 'Data collection',
      html: `---

## Part 2: Data Collection

**Step 2.** For each trial, set M, m, and theta in the simulation, then press Run. When the run completes, read the elapsed time t and distance d from the results panel and compute the measured acceleration a = 2d / t^2 (the sim also reports it as "from your data").

**Step 3.** Record each run in the table below. The theoretical acceleration column fills in automatically once M, m, and theta are entered. Compute the percent error yourself:

percent error = |a_measured - a_theoretical| / |a_theoretical| x 100`,
    },
    {
      kind: 'dataTable',
      tableId: 'dataTable',
      rowCount: 3,
      columns: [
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
          formula: (row: NumericRow) => {
            const M = row['M'] ?? 0;
            const m = row['m'] ?? 0;
            const theta = row['theta'] ?? 0;
            if (M + m === 0) return 0;
            return (G * (m - M * Math.sin((theta * Math.PI) / 180))) / (M + m);
          },
        },
        { id: 'pct_error', label: 'Percent error (%)', kind: 'input', unit: '%' },
      ],
    },
    {
      kind: 'instructions',
      tocLabel: 'Analysis',
      html: `---

## Part 3: Analysis`,
    },
    {
      kind: 'concept',
      fieldId: 'analysisVaryHangingMass',
      prompt:
        "In Trial 1, what happened to the acceleration as the hanging mass increased? Explain using Newton's second law.",
      rows: 4,
    },
    {
      kind: 'concept',
      fieldId: 'analysisVaryCartMass',
      prompt: 'In Trial 2, what happened to the acceleration as the cart mass increased? Why?',
      rows: 4,
    },
    {
      kind: 'concept',
      fieldId: 'analysisEquilibrium',
      prompt:
        'Describe what angle setting would cause the cart to remain stationary. Write the equation that relates M, m, and theta at that condition.',
      rows: 4,
    },
    {
      kind: 'concept',
      fieldId: 'analysisDoublingClaim',
      prompt:
        'A student claims that doubling the hanging mass always doubles the acceleration. Is this correct? Explain.',
      rows: 4,
    },
    {
      kind: 'instructions',
      tocLabel: 'Concept check',
      html: `---

## Concept Check Question

> [!WARNING]
> Predict first, then test your prediction in the simulation. If your prediction was wrong, explain what you were missing.`,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheckEqualIncrease',
      prompt:
        'If you increase both M and m by the same amount, does the acceleration increase, decrease, or stay the same? Predict first, then test it in the simulation.',
      rows: 4,
    },
  ],
};
