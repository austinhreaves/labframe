import type { Lab, NumericRow } from '@/domain/schema';

// FIRST DRAFT — new lab content for PHY 132 (Phase 4 reorg, 2026-05-02).
// Companion: REORG_PROPOSAL.md and LEGACY_PARITY_INVENTORY.md at the repo root.
// First of three filter-themed AC labs (RC low-pass → RL high-pass → RLC bandpass).
// TODO(austin): review prose, point values, and the choice of (R, C) parameter combinations.
// TODO(austin): confirm PhET CCK-AC supplies a frequency control over at least three decades
// and reads peak (or RMS) values for V across each component independently.
//
// Structure:
//   Part 1 (required): primary investigation — V_out across capacitor → low-pass
//   Part 2 (optional, extra credit): same circuit, V_out across resistor → high-pass

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

export const phy132RcLowPassFilterLab: Lab = {
  id: 'rcLowPassFilter',
  title: 'RC Circuits as Low-Pass Filters',
  description:
    'Drive a series RC circuit with a sinusoidal source, measure the gain V_out/V_in across multiple decades of frequency, and characterize low-pass behavior with V_out across the capacitor. Optional Part 2 enrichment re-measures with V_out across the resistor to demonstrate the complementary high-pass behavior of the same circuit.',
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
        'Objective — Explain in your own words what a low-pass filter is and what you intend to verify experimentally with the series RC circuit.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background',
        'A **filter** is any two-port circuit whose gain |H(jω)| = |V_out / V_in| depends on frequency. A **low-pass filter** passes low frequencies (gain ≈ 1) and attenuates high frequencies (gain → 0).',
        'For a series RC circuit driven by a sinusoidal source, with V_out taken **across the capacitor**:',
        '> H(jω) = V_C / V_source = (1/jωC) / (R + 1/jωC) = 1 / (1 + jωRC)',
        '> |H(jω)| = 1 / √(1 + (ωRC)²)',
        'This is a low-pass filter. Its **corner (3-dB) frequency** is f_c = 1 / (2πRC), the frequency at which |H| = 1/√2 ≈ 0.707. Below f_c the filter passes the signal nearly unattenuated; above f_c the gain rolls off at -20 dB/decade.',
        'This f_c is the same characteristic frequency you encountered as 1/τ in the RC discharge lab. The time-domain time constant and the frequency-domain corner frequency are two views of the same circuit physics.',
        '**Note on lab structure:** Part 1 below is required and characterizes low-pass behavior. Part 2 is an optional extra-credit enrichment that re-measures the **same circuit** with V_out across the resistor instead of the capacitor — demonstrating that the very same RC network can act as either a low-pass or high-pass filter depending on which port is your output.',
      ].join('\n\n'),
    },

    // ============================================================
    // PART 1 — Primary Investigation (required)
    // ============================================================
    {
      kind: 'instructions',
      html: '# Part 1: Low-Pass Filter Behavior (V_out across capacitor)',
    },
    {
      kind: 'instructions',
      html: [
        '## 1.1 Build the Series RC Filter',
        '1. Open the PhET Circuit Construction Kit: AC simulation.',
        '2. Build a series circuit: AC voltage source (sinusoidal), resistor R, capacitor C, ammeter in series with the loop, voltmeter across the AC source (V_in), second voltmeter across the capacitor (V_out).',
        '3. Use R and C from your Set of Parameters (default: R = 100 Ω, C = 1 µF, gives corner frequency f_c ≈ 1.6 kHz).',
        '4. Calculate the predicted corner frequency f_c = 1/(2πRC) and record it below.',
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
        { id: 'cValue', label: 'C', unit: 'F' },
        { id: 'sourceAmplitude', label: 'V_source peak amplitude', unit: 'V' },
        { id: 'fCornerPredicted', label: 'Predicted f_c = 1 / (2πRC)', unit: 'Hz' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: [
        '## 1.2 Frequency Sweep (V_out across capacitor)',
        'Set the source frequency to each value in your Set of Parameters (default: 10 Hz, 100 Hz, 1 kHz, 10 kHz, 100 kHz — straddling the corner). At each frequency:',
        '1. Wait for the circuit to reach steady state (a few cycles).',
        '2. Read peak voltage V_in across the source.',
        '3. Read peak voltage V_C across the capacitor (this is V_out for Part 1).',
        '4. Read peak current I through the loop (used in the impedance check).',
        '5. The derived columns ω, gain, and impedance will populate automatically.',
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
        { id: 'vOutPeak', label: 'V_out peak (across C)', kind: 'input', unit: 'V' },
        { id: 'iPeak', label: 'I peak', kind: 'input', unit: 'A' },
        {
          id: 'gainMeasured',
          label: '|H_C| = V_out / V_in',
          kind: 'derived',
          formulaLabel: 'V_C / V_in',
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
      yLabel: '|H_C| = V_out / V_in (low-pass)',
      points: 1,
      // Wants log-x axis. See docs/handoffs/log-axis-support-handoff.md.
    },
    {
      kind: 'instructions',
      html: [
        '## 1.3 Compare to Theoretical Low-Pass Response',
        'For each frequency in your sweep, calculate the predicted gain |H_C(jω)| = 1 / √(1 + (ωRC)²). Then compute the percent error between measured and predicted gain at each frequency.',
        'Pay special attention to the gain at f = f_c. If the simulation matches theory, the measured |H_C| at f_c should be approximately 0.707.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'part1PredictedGainCalculation',
      prompt:
        'Show the calculation of |H_C(jω)|_predicted at the corner frequency f = f_c (predicted gain should equal 1/√2 ≈ 0.707) and at one frequency well above f_c. Tabulate predicted gains at all five test frequencies in your written response.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'calculation',
      fieldId: 'part1GainPercentErrorAnalysis',
      prompt:
        'Compute the percent error between |H_C|_measured and |H_C|_predicted at each frequency. Comment on whether the agreement is uniform across the spectrum or whether it degrades in any frequency range.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'calculation',
      fieldId: 'part1CornerFrequencyExtraction',
      prompt:
        'From your Part 1 data, estimate the experimental corner frequency f_c,exp (the frequency at which |H_C| = 0.707) by interpolation between adjacent frequency points. Compare to the predicted f_c = 1/(2πRC) via percent difference.',
      equationEditor: true,
      points: 2,
    },

    // ============================================================
    // PART 2 — Optional Enrichment (extra credit)
    // ============================================================
    {
      kind: 'instructions',
      html: [
        '# Part 2 (Optional Extra Credit, up to +4 pts): High-Pass Behavior of the Same Circuit',
        '**Skip this part if you are short on time.** Part 2 explores the same RC network from a different vantage point. By moving the V_out probe from across the capacitor to across the resistor — without changing R, C, or the source — you will measure **high-pass** behavior in the same circuit you just used as a low-pass filter.',
        'The transfer function with V_out across the resistor is:',
        '> H_R(jω) = V_R / V_source = R / (R + 1/jωC) = jωRC / (1 + jωRC)',
        '> |H_R(jω)| = ωRC / √(1 + (ωRC)²)',
        'This is a high-pass filter with the **same corner frequency** f_c = 1/(2πRC) as the low-pass version. At f = f_c, both |H_C| and |H_R| equal 1/√2 ≈ 0.707.',
        'A useful identity: because V_R and V_C are 90° out of phase, the magnitudes satisfy |H_C|² + |H_R|² = 1 at every frequency. Verifying this from your two data sets is a quick sanity check.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## 2.1 Re-Probe the Circuit',
        '1. Leave R, C, and the AC source completely unchanged from Part 1.',
        '2. Move the second voltmeter from across the capacitor to across the resistor. This is your new V_out.',
        '3. Take a screenshot of the modified probe configuration.',
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
      yLabel: '|H_R| = V_out / V_in (high-pass)',
      points: 1,
      // Wants log-x axis (and ideally overlay with Part 1 gain on shared axes via multi-series
      // support). See docs/handoffs/.
    },
    {
      kind: 'instructions',
      html: [
        '## 2.3 Compare to Theoretical High-Pass Response and to Part 1',
        'For each frequency in your Part 2 sweep, calculate the predicted gain |H_R(jω)| = ωRC / √(1 + (ωRC)²). Compare measured and predicted via percent error.',
        'Then verify the identity: at each frequency, compute |H_C|² + |H_R|² using your Part 1 and Part 2 measured gains. The result should be close to 1 at every frequency. Comment on any discrepancy.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'part2PredictedGainCalculation',
      prompt:
        'Show the calculation of |H_R(jω)|_predicted at f = f_c (should equal 1/√2 ≈ 0.707) and at one frequency well below f_c. Tabulate predicted gains at all five test frequencies.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'part2IdentityCheck',
      prompt:
        'For each of your five test frequencies, compute |H_C|² + |H_R|² using the gains measured in Parts 1 and 2. Tabulate. The expected value is 1.000 at every frequency. Report the mean and the largest deviation from 1.',
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
        '1. From your Part 1 data, what value of |H_C| do you measure at frequencies well below f_c? What about frequencies well above f_c? Are these limits consistent with the low-pass filter behavior described in the Background?',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt:
        '2. The corner frequency f_c = 1/(2πRC) is also equal to 1/(2π · τ), where τ is the RC discharge time constant from the previous lab. Briefly explain in physical terms why the same characteristic frequency governs both the time-domain step response (discharge) and the frequency-domain steady-state response (filter behavior).',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt:
        '3. In a series RC circuit driven by a sinusoidal source, V_R peak + V_C peak does NOT equal V_in peak. Briefly explain why. Hint: think about the relative phase of V_R and V_C as phasors.',
      rows: 4,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        '4. If you completed Part 2, you measured both low-pass (V_out across C) and high-pass (V_out across R) behavior in the same circuit. Briefly explain in physical terms why the SAME circuit produces opposite filter behavior depending on which port you call the output. (If you skipped Part 2, predict the same answer from theory alone.)',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck5',
      prompt:
        '5. Low-pass filters are everywhere in real signal chains: audio system bass-only outputs, anti-aliasing filters in digital audio and ADCs, automotive sensor noise rejection, image processing blur kernels. Pick one and briefly explain how the underlying RC concept applies (or how a more complex implementation generalizes it).',
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
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric. Comment on the agreement between measured and predicted gain in Part 1, the value of f_c extracted from your data, and the conceptual link between τ (time domain) and f_c (frequency domain). If you completed Part 2, also discuss what the low-pass / high-pass duality reveals about the relationship between circuit topology and filter behavior.',
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
export const rcLowPassFilterLab = phy132RcLowPassFilterLab;
