import type { Lab, NumericRow } from '@/domain/schema';

// FIRST DRAFT — new lab content for PHY 132 (Phase 4 reorg, 2026-05-02).
// Companion: REORG_PROPOSAL.md and LEGACY_PARITY_INVENTORY.md at the repo root.
// Second of three filter-themed AC labs (RC low-pass → RL high-pass → RLC bandpass).
// TODO(austin): review prose, point values, and the choice of (R, L) parameter combinations.
// TODO(austin): confirm PhET CCK-AC supplies inductors with adjustable L over a useful range
// (default H values often don't span four decades cleanly). May need to constrain frequency
// sweep range based on what the sim allows.
//
// Structure:
//   Part 1 (required): primary investigation — V_out across inductor → high-pass
//   Part 2 (optional, extra credit): same circuit, V_out across resistor → low-pass

function angularFrequency(fieldName: string) {
  return (row: NumericRow): number => {
    const f = row[fieldName] ?? 0;
    return 2 * Math.PI * f;
  };
}

function gain(numField: string, denField: string) {
  return (row: NumericRow): number => {
    const num = row[numField] ?? 0;
    const den = row[denField] ?? 0;
    if (den === 0) return 0;
    return num / den;
  };
}

export const phy132RlHighPassFilterLab: Lab = {
  id: 'rlHighPassFilter',
  title: 'RL Circuits as High-Pass Filters',
  description:
    'Drive a series RL circuit with a sinusoidal source, measure the gain V_out/V_in across multiple decades of frequency, and characterize high-pass behavior with V_out across the inductor. Optional Part 2 enrichment re-measures with V_out across the resistor to demonstrate the complementary low-pass behavior of the same circuit. Direct counterpart to the RC low-pass filter lab.',
  category: 'Physics',
  simulations: {
    cckAC: {
      title: 'Circuit Construction Kit: AC',
      url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_all.html',
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
        'Objective — Explain in your own words what a high-pass filter is and what you intend to verify experimentally with the series RL circuit. Contrast with the RC low-pass behavior from the previous lab.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background',
        'You characterized RC circuits as low-pass filters in the previous lab. RL circuits exhibit the **opposite** asymmetry: they can act as **high-pass** filters when V_out is taken across the inductor.',
        'For a series RL circuit driven by a sinusoidal source, with V_out taken **across the inductor**:',
        '> H_L(jω) = V_L / V_source = jωL / (R + jωL) = jωτ_L / (1 + jωτ_L)',
        '> |H_L(jω)| = ωτ_L / √(1 + (ωτ_L)²)  where τ_L = L / R',
        'This is a high-pass filter. Its corner (3-dB) frequency is f_c = R / (2πL) = 1/(2π · τ_L), the frequency at which |H_L| = 1/√2 ≈ 0.707. Below f_c the filter attenuates the signal; above f_c the gain approaches 1.',
        '**The reactance contrast:**',
        '- Capacitor reactance: X_C = 1/(ωC) — **decreases** with frequency.',
        '- Inductor reactance: X_L = ωL — **increases** with frequency.',
        'A capacitor "looks like" a wire at high f and an open at low f. An inductor does the opposite: open at high f, wire at low f. This single observation explains why RC across the capacitor is low-pass, and RL across the inductor is high-pass.',
        '**Note on lab structure:** Part 1 below is required and characterizes high-pass behavior. Part 2 is an optional extra-credit enrichment that re-measures the **same circuit** with V_out across the resistor instead of the inductor — yielding the complementary low-pass response. This mirrors the optional Part 2 of the RC lab.',
      ].join('\n\n'),
    },

    // ============================================================
    // PART 1 — Primary Investigation (required)
    // ============================================================
    {
      kind: 'instructions',
      html: '# Part 1: High-Pass Filter Behavior (V_out across inductor)',
    },
    {
      kind: 'instructions',
      html: [
        '## 1.1 Build the Series RL Filter',
        '1. Open the PhET Circuit Construction Kit: AC simulation.',
        '2. Build a series circuit: AC voltage source (sinusoidal), resistor R, inductor L, ammeter in series with the loop, voltmeter across the AC source (V_in), second voltmeter across the inductor (V_out).',
        '3. Use R and L from your Set of Parameters. Default: R = 100 Ω, L = 10 mH gives corner frequency f_c = R/(2πL) ≈ 1.6 kHz, parallel to the RC lab.',
        '4. Calculate the predicted corner frequency f_c = R/(2πL) and the inductive time constant τ_L = L/R. Record below.',
        '5. Take a screenshot of the completed circuit.',
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
        { id: 'rValue', label: 'R', unit: 'Ω' },
        { id: 'lValue', label: 'L', unit: 'H' },
        { id: 'sourceAmplitude', label: 'V_source peak amplitude', unit: 'V' },
        { id: 'tauL', label: 'τ_L = L / R', unit: 's' },
        { id: 'fCornerPredicted', label: 'Predicted f_c = R / (2πL)', unit: 'Hz' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: [
        '## 1.2 Frequency Sweep (V_out across inductor)',
        'Set the source frequency to each value in your Set of Parameters (default: same five frequencies as the RC lab — 10 Hz, 100 Hz, 1 kHz, 10 kHz, 100 kHz). At each frequency:',
        '1. Wait for steady state.',
        '2. Read peak voltage V_in across the source.',
        '3. Read peak voltage V_L across the inductor (this is V_out for Part 1).',
        '4. Read peak voltage V_R across the resistor (used in the identity check if you complete Part 2).',
        '5. Read peak current I through the loop.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'part1FrequencySweepTable',
      rowCount: 5,
      points: 3,
      columns: [
        { id: 'frequency', label: 'f (Hz)', kind: 'input', unit: 'Hz' },
        {
          id: 'omega',
          label: 'ω = 2πf',
          kind: 'derived',
          formulaLabel: '2πf',
          deps: ['frequency'],
          precision: 2,
          formula: angularFrequency('frequency'),
        },
        { id: 'vInPeak', label: 'V_in peak', kind: 'input', unit: 'V' },
        { id: 'vOutPeak', label: 'V_out peak (across L)', kind: 'input', unit: 'V' },
        { id: 'vRPeak', label: 'V_R peak', kind: 'input', unit: 'V' },
        { id: 'iPeak', label: 'I peak', kind: 'input', unit: 'A' },
        {
          id: 'gainMeasured',
          label: '|H_L| = V_out / V_in',
          kind: 'derived',
          formulaLabel: 'V_L / V_in',
          deps: ['vOutPeak', 'vInPeak'],
          precision: 4,
          formula: gain('vOutPeak', 'vInPeak'),
        },
        {
          id: 'zMeasured',
          label: '|Z| = V_in / I',
          kind: 'derived',
          formulaLabel: 'V_in / I',
          deps: ['vInPeak', 'iPeak'],
          precision: 2,
          formula: gain('vInPeak', 'iPeak'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'part1GainVsFrequencyPlot',
      sourceTableId: 'part1FrequencySweepTable',
      xCol: 'frequency',
      yCol: 'gainMeasured',
      xLabel: 'f (Hz)',
      yLabel: '|H_L| = V_out / V_in (high-pass)',
      points: 1,
      // Wants log-x axis. See docs/handoffs/log-axis-support-handoff.md.
    },
    {
      kind: 'instructions',
      html: [
        '## 1.3 Compare to Theoretical High-Pass Response',
        'For each frequency in your sweep, calculate the predicted gain |H_L(jω)| = ωτ_L / √(1 + (ωτ_L)²). Then compute the percent error between measured and predicted gain at each frequency.',
        'Pay special attention to the gain at f = f_c. If the simulation matches theory, the measured |H_L| at f_c should be approximately 0.707.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'part1PredictedGainCalculation',
      prompt:
        'Show the calculation of |H_L(jω)|_predicted at the corner frequency f = f_c (predicted gain should equal 1/√2 ≈ 0.707) and at one frequency well below f_c. Tabulate predicted gains at all five test frequencies.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'calculation',
      fieldId: 'part1GainPercentErrorAnalysis',
      prompt:
        'Compute the percent error between |H_L|_measured and |H_L|_predicted at each frequency. Comment on whether the agreement is uniform across the spectrum or whether it degrades in any frequency range.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'calculation',
      fieldId: 'part1CornerFrequencyExtraction',
      prompt:
        'From your Part 1 data, estimate the experimental corner frequency f_c,exp (the frequency at which |H_L| = 0.707) by interpolation between adjacent frequency points. Compare to the predicted f_c = R/(2πL) via percent difference.',
      equationEditor: true,
      points: 2,
    },

    // ============================================================
    // PART 2 — Optional Enrichment (extra credit)
    // ============================================================
    {
      kind: 'instructions',
      html: [
        '# Part 2 (Optional Extra Credit, up to +4 pts): Low-Pass Behavior of the Same Circuit',
        '**Skip this part if you are short on time.** Part 2 mirrors the Part 2 enrichment of the RC lab. By moving the V_out probe from across the inductor to across the resistor — without changing R, L, or the source — you will measure **low-pass** behavior in the same RL circuit you just used as a high-pass filter.',
        'The transfer function with V_out across the resistor is:',
        '> H_R(jω) = V_R / V_source = R / (R + jωL) = 1 / (1 + jωτ_L)',
        '> |H_R(jω)| = 1 / √(1 + (ωτ_L)²)',
        'This is a low-pass filter with the **same corner frequency** f_c = R/(2πL) as the inductor-output version. At f = f_c, both |H_L| and |H_R| equal 1/√2 ≈ 0.707.',
        'The same identity from the RC lab applies here: |H_L|² + |H_R|² = 1 at every frequency, because V_L and V_R are 90° out of phase.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## 2.1 Re-Probe the Circuit',
        '1. Leave R, L, and the AC source completely unchanged from Part 1.',
        '2. Move the second voltmeter from across the inductor to across the resistor. This is your new V_out.',
        '3. Take a screenshot of the modified probe configuration.',
        '(Note: you already recorded V_R during the Part 1 sweep. If those values are still trustworthy at the same frequencies, you may simply copy them into the Part 2 table below rather than re-measuring. Document your choice.)',
      ].join('\n\n'),
    },
    {
      kind: 'image',
      imageId: 'part2CircuitImage',
      captionFieldId: 'part2CircuitCaption',
      maxMB: 5,
    },
    {
      kind: 'instructions',
      html: [
        '## 2.2 Frequency Sweep (V_out across resistor)',
        'Sweep through the same five frequencies you used in Part 1.2. At each frequency, record V_in peak and V_R peak (the new V_out). The gain column will populate automatically.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'part2FrequencySweepTable',
      rowCount: 5,
      points: 1.5,
      columns: [
        { id: 'frequency', label: 'f (Hz)', kind: 'input', unit: 'Hz' },
        {
          id: 'omega',
          label: 'ω = 2πf',
          kind: 'derived',
          formulaLabel: '2πf',
          deps: ['frequency'],
          precision: 2,
          formula: angularFrequency('frequency'),
        },
        { id: 'vInPeak', label: 'V_in peak', kind: 'input', unit: 'V' },
        { id: 'vOutPeak', label: 'V_out peak (across R)', kind: 'input', unit: 'V' },
        {
          id: 'gainMeasured',
          label: '|H_R| = V_out / V_in',
          kind: 'derived',
          formulaLabel: 'V_R / V_in',
          deps: ['vOutPeak', 'vInPeak'],
          precision: 4,
          formula: gain('vOutPeak', 'vInPeak'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'part2GainVsFrequencyPlot',
      sourceTableId: 'part2FrequencySweepTable',
      xCol: 'frequency',
      yCol: 'gainMeasured',
      xLabel: 'f (Hz)',
      yLabel: '|H_R| = V_out / V_in (low-pass)',
      points: 1,
      // Wants log-x axis (and ideally overlay with Part 1 gain on shared axes via multi-series
      // support). See docs/handoffs/.
    },
    {
      kind: 'instructions',
      html: [
        '## 2.3 Compare to Theoretical Low-Pass Response and to Part 1',
        'For each frequency in your Part 2 sweep, calculate the predicted gain |H_R(jω)| = 1 / √(1 + (ωτ_L)²). Compare measured and predicted via percent error.',
        'Then verify the identity: at each frequency, compute |H_L|² + |H_R|² using your Part 1 and Part 2 measured gains. The result should be close to 1 at every frequency. Comment on any discrepancy.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'part2PredictedGainCalculation',
      prompt:
        'Show the calculation of |H_R(jω)|_predicted at f = f_c (should equal 1/√2 ≈ 0.707) and at one frequency well above f_c. Tabulate predicted gains at all five test frequencies.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'part2IdentityCheck',
      prompt:
        'For each of your five test frequencies, compute |H_L|² + |H_R|² using the gains measured in Parts 1 and 2. Tabulate. The expected value is 1.000 at every frequency. Report the mean and the largest deviation from 1.',
      equationEditor: true,
      points: 1.5,
    },

    // ============================================================
    // Concept Check Questions (apply to both parts)
    // ============================================================
    {
      kind: 'instructions',
      html: '## Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck1',
      prompt:
        '1. Compare the limiting behavior of |H_L| at low f and high f for this RL circuit (V_out across L) versus the RC circuit (V_out across C) from the previous lab. They should be **mirror images**. Confirm this from your data and briefly explain physically why the inductor does the opposite of what the capacitor does.',
      rows: 6,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt:
        '2. The corner frequency f_c = R/(2πL) is also equal to 1/(2π·τ_L), where τ_L = L/R is the inductive time constant. Briefly explain why τ_L = L/R has units of seconds (work out the units explicitly) and what it represents physically (hint: it is the time constant of an RL step-current response).',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt:
        '3. Just as in the RC lab, the peak voltages V_R + V_L do not add to V_in for an RL circuit. Sketch a phasor diagram showing V_R, V_L, and V_in at f = f_c (V_L leads V_R by 90°). Confirm geometrically that |V_in| = √(V_R² + V_L²).',
      rows: 6,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        '4. If you completed Part 2, you measured both high-pass (V_out across L) and low-pass (V_out across R) behavior in the same RL circuit. Briefly explain in physical terms why the SAME circuit produces opposite filter behavior depending on which port you call the output. Compare with the analogous result in the RC lab. (If you skipped Part 2, predict the same answer from theory alone.)',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck5',
      prompt:
        '5. High-pass filters appear in audio (DC-blocking capacitors at amplifier inputs, tweeters in crossover networks), in instrumentation (AC-coupling oscilloscopes), and in radio (RF coupling stages). Pick one example and briefly explain how a high-pass filter solves a problem in that context.',
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
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric. Compare your RL high-pass results explicitly to the RC low-pass results from the previous lab — agreement, asymmetries, and the underlying physics that explains the contrast. If you completed Part 2, also discuss what the high-pass / low-pass duality reveals about the relationship between circuit topology and output port choice.',
      rows: 8,
      points: 5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include Student Info, all worksheet responses, both circuit screenshots (if Part 2 was completed), the frequency-sweep data tables with derived columns, the gain vs frequency plots, percent-error analyses, and a Process Record appendix.',
      ].join('\n\n'),
    },
  ],
};

/** @deprecated reserved alias slot. */
export const rlHighPassFilterLab = phy132RlHighPassFilterLab;
