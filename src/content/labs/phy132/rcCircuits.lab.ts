import type { Lab, NumericRow } from '@/domain/schema';

// FIRST DRAFT — new lab content for PHY 132 (Phase 4 reorg, 2026-05-02).
// Companion: REORG_PROPOSAL.md and LEGACY_PARITY_INVENTORY.md at the repo root.
// TODO(austin): review prose, point values, the choice of (R, C) parameter combinations,
// and whether PhET CCK-DC supports time-resolved voltage measurement (or if students should
// use the simulation's built-in chart / digital multimeter readout at fixed time stamps).

function naturalLog(fieldName: string) {
  return (row: NumericRow): number => {
    const v = row[fieldName];
    if (v === undefined || v <= 0) return 0;
    return Math.log(v);
  };
}

export const phy132RcCircuitsLab: Lab = {
  id: 'rcCircuits',
  title: 'RC Circuits — Charging, Discharging, and the Time Constant',
  description:
    'Measure the exponential discharge of a capacitor through a resistor, extract the time constant via log-linearization, and verify τ = RC across multiple parameter combinations.',
  category: 'Physics',
  simulations: {
    cckDC: {
      title: 'Circuit Construction Kit: DC',
      url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
      allow: 'fullscreen',
    },
  },
  sections: [
    {
      kind: 'instructions',
      tocHidden: true,
      html: [
        '## Integrity Agreement',
        'Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.',
      ].join('\n\n'),
    },
    {
      kind: 'objective',
      fieldId: 'objective',
      prompt:
        'Objective — Explain in your own words what you intend to measure and why the time constant τ = RC characterizes the circuit response.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background',
        'When a charged capacitor C discharges through a resistor R, the voltage across the capacitor decays exponentially:',
        '> V(t) = V₀ · exp(-t / τ),  where  τ = R · C',
        'τ has units of seconds (Ω · F = s) and represents the time required for V to fall to V₀/e ≈ 0.368 V₀. After 5τ the capacitor is essentially fully discharged.',
        '**Linearization strategy.** Taking the natural log of both sides:',
        '> ln(V) = ln(V₀) - t / τ',
        'A plot of ln(V) vs t is linear with slope -1/τ. This is the analysis you will perform on each (R, C) configuration to extract τ experimentally and compare against the predicted RC product.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## Part 1: Build the Discharge Circuit',
        '1. Open the PhET Circuit Construction Kit: DC simulation.',
        '2. Build a series circuit: battery (V₀), switch, capacitor C, resistor R, voltmeter across the capacitor.',
        '3. Configuration A: use R₁, C₁ from your Set of Parameters.',
        '4. Close the switch to charge the capacitor to V₀. Open the switch to begin discharge through R.',
        '5. Take a screenshot of your completed circuit.',
      ].join('\n\n'),
    },
    {
      kind: 'image',
      imageId: 'part1CircuitImage',
      captionFieldId: 'part1CircuitCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'v0', label: 'V₀ (initial capacitor voltage)', unit: 'V' },
        { id: 'r1Value', label: 'R₁', unit: 'Ω' },
        { id: 'c1Value', label: 'C₁', unit: 'F' },
        { id: 'tauPredicted1', label: 'Predicted τ₁ = R₁ · C₁', unit: 's' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 2: Discharge Curve, Configuration A (R₁, C₁)',
        '1. With the capacitor charged to V₀ and the switch open (no current path), prepare to record V across the capacitor at fixed time intervals as discharge proceeds.',
        '2. Close the switch onto the discharge path and start your timer simultaneously.',
        '3. Record V at t = 0, then at evenly spaced time intervals out to at least 5τ. Use the time intervals from your Set of Parameters.',
        '4. The derived ln(V) column will populate automatically.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'dischargeTableA',
      rowCount: 10,
      points: 2,
      columns: [
        { id: 'time', label: 't (s)', kind: 'input', unit: 's' },
        { id: 'voltage', label: 'V (V)', kind: 'input', unit: 'V' },
        {
          id: 'lnVoltage',
          label: 'ln(V)',
          kind: 'derived',
          formulaLabel: 'ln(V)',
          deps: ['voltage'],
          precision: 4,
          formula: naturalLog('voltage'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'dischargePlotA',
      sourceTableId: 'dischargeTableA',
      xCol: 'time',
      yCol: 'voltage',
      xLabel: 't (s)',
      yLabel: 'V (V)',
      points: 0.5,
    },
    {
      kind: 'plot',
      plotId: 'lnDischargePlotA',
      sourceTableId: 'dischargeTableA',
      xCol: 'time',
      yCol: 'lnVoltage',
      xLabel: 't (s)',
      yLabel: 'ln(V)',
      points: 1,
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
    },
    {
      kind: 'instructions',
      html:
        'On the ln(V) vs t plot, apply a linear fit. Record the slope m_A and its uncertainty. The time constant is τ_A = -1 / m_A.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'slopeA', label: 'm_A (slope of ln(V) vs t)', unit: '1/s' },
        { id: 'slopeAUncertainty', label: 'Δm_A (slope uncertainty)', unit: '1/s' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      fieldId: 'tauACalculation',
      prompt:
        'Calculate τ_A = -1 / m_A and propagate the uncertainty: Δτ_A = |τ_A| · |Δm_A / m_A|. Compare your experimental τ_A to the predicted τ₁ = R₁ · C₁ via percent difference.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 3: Repeat for Configurations B and C',
        'Repeat the discharge measurement and analysis for two additional parameter sets:',
        '- Configuration B: use R₂, C₁ (vary R only — predicted τ₂ = R₂ · C₁).',
        '- Configuration C: use R₁, C₂ (vary C only — predicted τ₃ = R₁ · C₂).',
        'Use the same procedure as Part 2 for each. Record results in the tables below.',
      ].join('\n\n'),
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'r2Value', label: 'R₂', unit: 'Ω' },
        { id: 'c2Value', label: 'C₂', unit: 'F' },
        { id: 'tauPredicted2', label: 'Predicted τ₂ = R₂ · C₁', unit: 's' },
        { id: 'tauPredicted3', label: 'Predicted τ₃ = R₁ · C₂', unit: 's' },
      ],
      points: 0.5,
    },
    {
      kind: 'dataTable',
      tableId: 'dischargeTableB',
      rowCount: 10,
      points: 1.5,
      columns: [
        { id: 'time', label: 't (s)', kind: 'input', unit: 's' },
        { id: 'voltage', label: 'V (V)', kind: 'input', unit: 'V' },
        {
          id: 'lnVoltage',
          label: 'ln(V)',
          kind: 'derived',
          formulaLabel: 'ln(V)',
          deps: ['voltage'],
          precision: 4,
          formula: naturalLog('voltage'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'lnDischargePlotB',
      sourceTableId: 'dischargeTableB',
      xCol: 'time',
      yCol: 'lnVoltage',
      xLabel: 't (s)',
      yLabel: 'ln(V)',
      points: 0.5,
      fits: [{ id: 'linear', label: 'Linear (y = mx + b)' }],
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'slopeB', label: 'm_B', unit: '1/s' },
        { id: 'slopeBUncertainty', label: 'Δm_B', unit: '1/s' },
      ],
      points: 0.25,
    },
    {
      kind: 'calculation',
      fieldId: 'tauBCalculation',
      prompt: 'Calculate τ_B and Δτ_B. Compare to predicted τ₂ via percent difference.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'dataTable',
      tableId: 'dischargeTableC',
      rowCount: 10,
      points: 1.5,
      columns: [
        { id: 'time', label: 't (s)', kind: 'input', unit: 's' },
        { id: 'voltage', label: 'V (V)', kind: 'input', unit: 'V' },
        {
          id: 'lnVoltage',
          label: 'ln(V)',
          kind: 'derived',
          formulaLabel: 'ln(V)',
          deps: ['voltage'],
          precision: 4,
          formula: naturalLog('voltage'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'lnDischargePlotC',
      sourceTableId: 'dischargeTableC',
      xCol: 'time',
      yCol: 'lnVoltage',
      xLabel: 't (s)',
      yLabel: 'ln(V)',
      points: 0.5,
      fits: [{ id: 'linear', label: 'Linear (y = mx + b)' }],
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'slopeC', label: 'm_C', unit: '1/s' },
        { id: 'slopeCUncertainty', label: 'Δm_C', unit: '1/s' },
      ],
      points: 0.25,
    },
    {
      kind: 'calculation',
      fieldId: 'tauCCalculation',
      prompt: 'Calculate τ_C and Δτ_C. Compare to predicted τ₃ via percent difference.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '## Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck1',
      prompt:
        '1. Why is ln(V) vs t expected to be linear during exponential discharge? Show the mathematical derivation in two or three lines.',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt:
        '2. Compare τ_A, τ_B, and τ_C. Configuration B doubled R; Configuration C doubled C. Did τ scale as predicted by τ = RC? If your measurements disagree, propose a physical or simulation-related explanation.',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt:
        "3. The half-life t₁/₂ of an exponential decay (the time for V to fall to V₀/2) is related to τ by t₁/₂ = τ · ln(2) ≈ 0.693 τ. From any one of your data sets, estimate t₁/₂ directly from the V vs t plot and compare to 0.693 · τ_extracted.",
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        '4. Exponential decay shows up everywhere in physics: radioactive decay, Newton\'s law of cooling, RL circuit current, atmospheric pressure with altitude. Pick one and briefly explain how its decay constant is analogous to τ = RC.',
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric. Comment on the level of agreement between measured and predicted τ values and on the analytical advantage of log-linearization.',
      rows: 8,
      points: 5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include Student Info, all worksheet responses, the circuit screenshot, the three discharge data tables, all decay plots (including log-linearized fits), and a Process Record appendix.',
      ].join('\n\n'),
    },
  ],
};

/** @deprecated reserved alias slot. */
export const rcCircuitsLab = phy132RcCircuitsLab;
