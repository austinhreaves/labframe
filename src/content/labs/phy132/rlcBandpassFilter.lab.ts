import type { Lab, NumericRow } from '@/domain/schema';

// FIRST DRAFT — new lab content for PHY 132 (Phase 4 reorg, 2026-05-02).
// Companion: REORG_PROPOSAL.md and LEGACY_PARITY_INVENTORY.md at the repo root.
// Third of three filter-themed AC labs (RC low-pass → RL high-pass → RLC bandpass).
// Capstone of the AC sequence. Students should be comfortable with phasors and
// frequency response from the previous two labs.
// TODO(austin): review prose, point values, choice of (R, L, C) parameters.
// Default parameters target a moderate Q (~5) so the resonance is sharp but not too narrow
// to find. Adjust if PhET CCK-AC frequency precision constrains.
// TODO(austin): the frequency sweep will need to be DENSER near resonance than far from it.
// Consider asking students to take 4 wide-spaced points and 5-7 close-spaced near f_0.
//
// Structure:
//   Part 1 (required): primary investigation — V_out across resistor → bandpass
//   Part 2 (optional, extra credit): same circuit, V_out across L+C tank → notch (band-stop)

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

export const phy132RlcBandpassFilterLab: Lab = {
  id: 'rlcBandpassFilter',
  title: 'RLC Circuits as Bandpass Filters — Resonance, Bandwidth, and Q-Factor',
  description:
    'Drive a series RLC circuit with a sinusoidal source, identify the resonance frequency ω₀ = 1/√(LC), measure the -3dB bandwidth, and compute the quality factor Q with V_out across the resistor (bandpass). Optional Part 2 enrichment re-measures with V_out across the L+C tank to demonstrate the complementary band-stop (notch) behavior of the same circuit.',
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
        'Objective — Explain in your own words what a bandpass filter is and what you intend to verify experimentally about the series RLC circuit at and near resonance.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background',
        'You characterized RC and RL circuits as low-pass and high-pass filters in the previous two labs. The series RLC circuit is the simplest **bandpass** filter: it passes a narrow band of frequencies around its **resonance frequency** and attenuates everything else.',
        'For a series RLC circuit driven by a sinusoidal source, the total impedance is',
        '> Z(jω) = R + jωL + 1/(jωC) = R + j(ωL - 1/(ωC))',
        'The reactive part vanishes when ωL = 1/(ωC), i.e., at the **resonance frequency**',
        '> ω₀ = 1 / √(LC),  f₀ = 1 / (2π√(LC))',
        'At resonance, |Z| = R (its minimum value), current is maximum, and the voltage across R equals V_in. With V_out taken across R:',
        '> H_R(jω) = V_R / V_in = R / Z(jω)',
        '> |H_R(jω)| = R / √(R² + (ωL - 1/(ωC))²)',
        '|H_R| = 1 at resonance and falls off on both sides — the defining feature of a bandpass filter.',
        '**Bandwidth and Q.** The -3dB bandwidth Δω is the width of the resonance peak between the two frequencies where |H_R| = 1/√2 ≈ 0.707. For a series RLC:',
        '> Δω = R / L,  Q ≡ ω₀ / Δω = (1/R) · √(L/C)',
        'Q is the **quality factor** — high Q means a sharp resonance (narrow bandwidth, slowly decaying free oscillations); low Q means a broad resonance (heavily damped, quickly decaying oscillations).',
        '**Note on lab structure:** Part 1 below is required and characterizes bandpass behavior. Part 2 is an optional extra-credit enrichment that re-measures the **same circuit** with V_out across the L+C tank (the inductor and capacitor in series, treated as one port) — yielding a **notch (band-stop) filter** centered at the same resonance frequency. This completes the duality theme from the RC and RL labs.',
      ].join('\n\n'),
    },

    // ============================================================
    // PART 1 — Primary Investigation (required)
    // ============================================================
    {
      kind: 'instructions',
      html: '# Part 1: Bandpass Filter Behavior (V_out across resistor)',
    },
    {
      kind: 'instructions',
      html: [
        '## 1.1 Build the Series RLC Filter and Predict Resonance',
        '1. Open the PhET Circuit Construction Kit: AC simulation.',
        '2. Build a series circuit: AC voltage source (sinusoidal), resistor R, inductor L, capacitor C, ammeter in series, voltmeter across V_in, second voltmeter across the resistor (V_out).',
        '3. Use R, L, C from your Set of Parameters. Default: R = 50 Ω, L = 10 mH, C = 1 µF — gives f₀ ≈ 1.6 kHz, Δω/(2π) ≈ 800 Hz, Q ≈ 2 (modest sharpness, easy to scan).',
        '4. Calculate predicted ω₀, f₀, Δω, and Q from the formulas in the Background.',
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
        { id: 'cValue', label: 'C', unit: 'F' },
        { id: 'sourceAmplitude', label: 'V_source peak amplitude', unit: 'V' },
        { id: 'omega0Predicted', label: 'Predicted ω₀ = 1/√(LC)', unit: 'rad/s' },
        { id: 'f0Predicted', label: 'Predicted f₀', unit: 'Hz' },
        { id: 'deltaOmegaPredicted', label: 'Predicted Δω = R/L', unit: 'rad/s' },
        { id: 'qPredicted', label: 'Predicted Q = ω₀/Δω' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## 1.2 Frequency Sweep — Find the Resonance (V_out across resistor)',
        'Sweep the source frequency through the range that brackets f₀. Use the frequencies in your Set of Parameters: a few wide-spaced points well outside the resonance to anchor the baseline, plus several closely-spaced points near f₀ to capture the peak shape.',
        'At each frequency, record V_in peak, V_out peak (across R), and current I peak. The derived gain column will populate automatically.',
        'You should see the gain rise to a maximum near f₀, then fall again. The peak gain should approach 1 if the circuit is well-tuned.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'part1FrequencySweepTable',
      rowCount: 11,
      points: 4,
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
        { id: 'iPeak', label: 'I peak', kind: 'input', unit: 'A' },
        {
          id: 'gainMeasured',
          label: '|H_R| = V_out / V_in',
          kind: 'derived',
          formulaLabel: 'V_R / V_in',
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
      yLabel: '|H_R| = V_out / V_in (bandpass)',
      points: 1,
      // Wants log-x axis at minimum; ideally also a marked horizontal line at |H| = 0.707.
      // See docs/handoffs/log-axis-support-handoff.md.
    },
    {
      kind: 'instructions',
      html: [
        '## 1.3 Extract f₀, Bandwidth, and Q from Data',
        'From your gain vs frequency plot:',
        '1. Identify f₀,exp — the frequency at which |H_R| is maximum.',
        '2. Identify f_low and f_high — the two frequencies where |H_R| = 0.707 (use linear interpolation between adjacent measurement points if needed).',
        '3. Compute the experimental bandwidth Δf_exp = f_high - f_low and Δω_exp = 2π · Δf_exp.',
        '4. Compute Q_exp = ω₀,exp / Δω_exp.',
        '5. Compare each experimental value to its prediction via percent difference.',
      ].join('\n\n'),
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'f0Experimental', label: 'f₀ experimental', unit: 'Hz' },
        { id: 'fLow', label: 'f_low (lower -3dB point)', unit: 'Hz' },
        { id: 'fHigh', label: 'f_high (upper -3dB point)', unit: 'Hz' },
        { id: 'deltaFExp', label: 'Δf experimental', unit: 'Hz' },
        { id: 'qExperimental', label: 'Q experimental' },
      ],
      points: 1.5,
    },
    {
      kind: 'calculation',
      fieldId: 'part1ResonanceComparisonCalculation',
      prompt:
        'Compute percent differences: (f₀,exp vs predicted f₀), (Δf,exp vs predicted Δf = Δω/(2π)), (Q,exp vs predicted Q). Show your arithmetic and comment on whether the agreement is within reasonable measurement precision.',
      equationEditor: true,
      points: 2,
    },

    // ============================================================
    // PART 2 — Optional Enrichment (extra credit)
    // ============================================================
    {
      kind: 'instructions',
      html: [
        '# Part 2 (Optional Extra Credit, up to +5 pts): Notch (Band-Stop) Behavior of the Same Circuit',
        '**Skip this part if you are short on time.** Part 2 completes the duality story from the RC and RL labs. By moving the V_out probe from across the resistor to across the **L+C tank** — both the inductor and capacitor together, treated as one port — you will measure **band-stop (notch)** behavior in the same RLC circuit you just used as a bandpass filter.',
        'The transfer function with V_out across the LC tank is:',
        '> Z_LC = jωL + 1/(jωC) = j(ωL - 1/(ωC))',
        '> H_LC(jω) = V_LC / V_source = Z_LC / Z(jω)',
        '> |H_LC(jω)| = |ωL - 1/(ωC)| / √(R² + (ωL - 1/(ωC))²)',
        '**At resonance** (ω = ω₀): the reactive parts cancel, so |Z_LC| = 0 and **|H_LC| = 0**. The output is a deep null at f₀ — the defining feature of a notch (band-stop) filter.',
        '**Far from resonance:** at ω → 0, |1/ωC| dominates and |H_LC| → 1. At ω → ∞, |ωL| dominates and |H_LC| → 1. So the notch passes everything except a narrow band around f₀.',
        'The same Pythagorean identity from the RC and RL labs applies here, generalized: **|H_R|² + |H_LC|² = 1 at every frequency**. V_R and V_LC are 90° out of phase (V_R is in phase with current; V_LC is purely reactive), so their squared magnitudes sum to V_in². Verifying this from your Part 1 and Part 2 data sets is a quick sanity check.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## 2.1 Re-Probe the Circuit',
        '1. Leave R, L, C, and the AC source completely unchanged from Part 1.',
        '2. Move the second voltmeter so its probes span **both** the inductor and capacitor (one probe on the far side of L, one on the far side of C — skipping over R). This new V_out is V_LC.',
        '3. Take a screenshot of the modified probe configuration. Make sure the voltmeter\'s leads are clearly visible spanning the L+C combination.',
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
        '## 2.2 Frequency Sweep (V_out across L+C tank)',
        'Sweep through the same eleven frequencies you used in Part 1.2. At each frequency, record V_in peak and V_LC peak (the new V_out). The gain column will populate automatically.',
        'You should see the **opposite** behavior from Part 1: gain near 1 at the wide-spaced points, falling to a deep null at f₀.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'part2FrequencySweepTable',
      rowCount: 11,
      points: 2,
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
        { id: 'vOutPeak', label: 'V_out peak (across L+C)', kind: 'input', unit: 'V' },
        {
          id: 'gainMeasured',
          label: '|H_LC| = V_out / V_in',
          kind: 'derived',
          formulaLabel: 'V_LC / V_in',
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
      yLabel: '|H_LC| = V_out / V_in (notch)',
      points: 1,
      // Wants log-x axis. Ideally overlay with Part 1 gain on shared axes via multi-series
      // support — would make the bandpass/notch duality visually striking. See docs/handoffs/.
    },
    {
      kind: 'instructions',
      html: [
        '## 2.3 Compare to Theoretical Notch Response and to Part 1',
        'For each frequency in your Part 2 sweep, calculate the predicted gain |H_LC(jω)| = |ωL - 1/(ωC)| / √(R² + (ωL - 1/(ωC))²). Compare measured and predicted via percent error.',
        'Then verify the identity: at each frequency, compute |H_R|² + |H_LC|² using your Part 1 and Part 2 measured gains. The result should be close to 1 at every frequency, including at f₀ (where |H_R| ≈ 1 and |H_LC| ≈ 0).',
        'Estimate the **notch depth** at f₀,exp — the minimum value of |H_LC|. In an ideal circuit the notch would reach 0; in a real (or simulated) circuit it is limited by component non-idealities and measurement precision.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'part2PredictedGainCalculation',
      prompt:
        'Show the calculation of |H_LC(jω)|_predicted at f = f₀ (should equal 0) and at one frequency well outside the notch (should approach 1). Tabulate predicted gains at all eleven test frequencies.',
      equationEditor: true,
      points: 1.5,
    },
    {
      kind: 'calculation',
      fieldId: 'part2IdentityCheck',
      prompt:
        'For each of your eleven test frequencies, compute |H_R|² + |H_LC|² using the gains measured in Parts 1 and 2. Tabulate. The expected value is 1.000 at every frequency. Report the mean and the largest deviation from 1. Pay particular attention to the result at f₀: |H_R| should be near 1 and |H_LC| should be near 0, and their squares should still sum to ~1.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'measurement',
      fieldId: 'notchDepthExp',
      label: 'Measured notch depth at f₀ (minimum |H_LC|)',
      points: 0.5,
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
        '1. At resonance, the inductor and capacitor reactances cancel: ωL = 1/(ωC). Explain in physical terms what this means about the energy flow in the circuit at resonance — where is the energy stored, and how does it move?',
      rows: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt:
        '2. At resonance the current through the loop is maximum, and the voltage across the resistor equals V_in. But the individual voltages V_L and V_C across the inductor and capacitor can be many times larger than V_in. Explain how this is possible without violating energy conservation. Hint: think about phasor cancellation between V_L and V_C. (If you completed Part 2, this is exactly why |H_LC| ≈ 0 at f₀ even though V_L and V_C individually are huge.)',
      rows: 5,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt:
        '3. Q-factor controls the sharpness of the resonance peak. Predict (without remeasuring) what would happen to f₀, Δf, and Q if you doubled R while keeping L and C fixed. Then predict what would happen if you doubled L while keeping R and C fixed. Justify your predictions using the formulas.',
      rows: 6,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        '4. If you completed Part 2, the bandpass and notch responses you measured are perfectly complementary: the bandpass passes what the notch blocks, and vice versa. Briefly explain in physical terms why the SAME RLC circuit produces opposite filter behavior depending on whether V_out is taken across R or across the LC tank. Compare with the analogous bandpass-vs-notch duality in the RC (low-pass/high-pass) and RL (high-pass/low-pass) labs. (If you skipped Part 2, predict the same answer from theory alone.)',
      rows: 6,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck5',
      prompt:
        '5. Bandpass filtering and resonance underpin radio tuning, MRI signal selection, the operation of every musical instrument with a fundamental pitch, and the design of LC oscillators in clocks and microcontrollers. Notch filters appear in 60 Hz hum rejection in audio systems, in cardiac signal processing (notching out powerline interference from ECGs), and in vibration isolation. Pick one bandpass and one notch application and briefly explain the role of the resonant behavior in each.',
      rows: 6,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck6',
      prompt:
        '6. (Optional, +2 pts extra credit) The series RLC has a parallel-RLC counterpart (a capacitor and inductor in parallel, with a resistor in series with the source). The parallel-RLC has the same resonance frequency ω₀ = 1/√(LC) but its impedance is **maximum** at resonance (whereas series-RLC impedance is minimum). Briefly derive |Z_parallel| at resonance, and explain when you would prefer the parallel topology over the series one.',
      rows: 8,
    },
    {
      kind: 'instructions',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric. Synthesize the three filter labs (RC low-pass/high-pass, RL high-pass/low-pass, RLC bandpass/notch) — what is the unifying physics, and how does each circuit element shape the frequency response? If you completed Parts 2 of any of the three labs, comment on the broader pattern: every two-element AC voltage divider has a complementary pair of filter responses depending on which element you call the output. The same physics — phasor relationships between component voltages — underlies all three identities.',
      rows: 10,
      points: 5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include Student Info, all worksheet responses, both circuit screenshots (if Part 2 was completed), the frequency-sweep data tables with derived columns, the gain vs frequency plots, the resonance / bandwidth / Q analysis, the |H_R|² + |H_LC|² = 1 identity check (if Part 2 was completed), percent-error comparisons, and a Process Record appendix.',
      ].join('\n\n'),
    },
  ],
};

/** @deprecated reserved alias slot. */
export const rlcBandpassFilterLab = phy132RlcBandpassFilterLab;
