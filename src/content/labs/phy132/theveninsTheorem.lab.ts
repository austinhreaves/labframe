import type { Lab } from '@/domain/schema';

// FIRST DRAFT — new lab content for PHY 132 (Phase 4 reorg, 2026-05-02).
// Companion: REORG_PROPOSAL.md and LEGACY_PARITY_INVENTORY.md at the repo root.
// TODO(austin): review prose, point values, and the example circuit choice in Part 1.
// TODO(austin): confirm PhET CCK-DC supplies a multimeter that reads both V and I,
// and that "open circuit" / "short circuit" measurements are practical inside the sim.

export const phy132TheveninsTheoremLab: Lab = {
  id: 'theveninsTheorem',
  title: "Thevenin's Theorem",
  description:
    'Reduce a two-terminal linear DC network to its Thevenin equivalent (V_th + R_th) using open-circuit voltage and short-circuit current measurements, then verify the equivalence by comparing load behavior under both circuits.',
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
        'Objective — Explain in your own words what Thevenin\'s Theorem claims and what you intend to verify experimentally. Two or three sentences.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background',
        "Thevenin's Theorem states that any linear two-terminal DC network can be replaced by a single voltage source V_th in series with a single resistance R_th, such that any external load connected across the terminals will draw the same current and develop the same voltage as it would with the original network.",
        '- **V_th** (Thevenin voltage) equals the open-circuit voltage measured across the two terminals with no load connected.',
        '- **R_th** (Thevenin resistance) equals V_th divided by I_sc, where I_sc is the short-circuit current that flows when the terminals are connected directly with an ideal wire.',
        'In this lab you will (1) build a target two-terminal network, (2) measure V_th and I_sc to compute R_th, (3) build the Thevenin equivalent, and (4) verify that both circuits behave identically under several different load resistances.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## Part 1: Build the Target Network and Identify Terminals',
        '1. Open the PhET Circuit Construction Kit: DC simulation.',
        '2. Build the target network specified in your Set of Parameters. The default network is two batteries (ε₁, ε₂) and three resistors (R₁, R₂, R₃) arranged so that two nodes form the open terminals A and B.',
        '3. Take a screenshot of your completed network with all component values visible. Label the terminals A and B clearly in the caption.',
      ].join('\n\n'),
      // TODO(austin): finalize the example network. Current default is the same 2-battery / 3-resistor
      // network from the legacy dcCircuits Part 2A. Reusing it lets students see the same circuit they
      // analyzed via Kirchhoff and now reduce via Thevenin — direct comparison of methods.
    },
    {
      kind: 'image',
      imageId: 'part1NetworkImage',
      captionFieldId: 'part1NetworkCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'epsilon1', label: 'ε₁ (battery 1)', unit: 'V' },
        { id: 'epsilon2', label: 'ε₂ (battery 2)', unit: 'V' },
        { id: 'r1Value', label: 'R₁', unit: 'Ω' },
        { id: 'r2Value', label: 'R₂', unit: 'Ω' },
        { id: 'r3Value', label: 'R₃', unit: 'Ω' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 2: Measure V_th (Open-Circuit Voltage)',
        '1. With nothing connected between terminals A and B, place the voltmeter across them.',
        '2. Record the open-circuit voltage. By definition, V_th = V_AB(open).',
      ].join('\n\n'),
    },
    {
      kind: 'measurement',
      fieldId: 'vTh',
      label: 'V_th = V_AB(open)',
      unit: 'V',
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 3: Measure I_sc (Short-Circuit Current)',
        '1. Connect terminals A and B directly with an ideal wire (zero resistance).',
        '2. Place the ammeter in series with this wire.',
        '3. Record the short-circuit current I_sc.',
        '4. Calculate R_th = V_th / I_sc and record below.',
        'Note: the short-circuit measurement may stress the simulated batteries — record the value quickly and remove the short before analyzing.',
      ].join('\n\n'),
    },
    {
      kind: 'measurement',
      fieldId: 'iSc',
      label: 'I_sc (short-circuit current)',
      unit: 'A',
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'rThCalculation',
      prompt: 'Calculate R_th = V_th / I_sc. Show units and significant figures.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 4: Build the Thevenin Equivalent',
        '1. In a fresh circuit area, build the Thevenin equivalent: a single battery set to V_th in series with a single resistor set to R_th, terminating at two new terminals A\' and B\'.',
        '2. Take a screenshot of the equivalent circuit with values visible.',
      ].join('\n\n'),
    },
    {
      kind: 'image',
      imageId: 'part4EquivalentImage',
      captionFieldId: 'part4EquivalentCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 5: Verify Equivalence Under Load',
        'For each load resistance R_L in your Set of Parameters, connect R_L across both circuits in turn (original network: terminals A-B; Thevenin equivalent: terminals A\'-B\'). Record V_L and I_L for each.',
        'If Thevenin\'s Theorem holds, the (V_L, I_L) pairs should match within measurement precision for every R_L.',
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'verificationTable',
      rowCount: 6,
      points: 3,
      columns: [
        { id: 'rLoad', label: 'R_L', kind: 'input', unit: 'Ω' },
        { id: 'vL_orig', label: 'V_L (original)', kind: 'input', unit: 'V' },
        { id: 'iL_orig', label: 'I_L (original)', kind: 'input', unit: 'A' },
        { id: 'vL_th', label: 'V_L (Thevenin eq)', kind: 'input', unit: 'V' },
        { id: 'iL_th', label: 'I_L (Thevenin eq)', kind: 'input', unit: 'A' },
        // TODO(austin): consider a derived "% difference in V_L" column; needs schema support
        // for derived columns referencing two input columns of the same row.
      ],
    },
    {
      kind: 'plot',
      plotId: 'vLoadVsRLoadPlot',
      sourceTableId: 'verificationTable',
      xCol: 'rLoad',
      yCol: 'vL_orig',
      xLabel: 'R_L (Ω)',
      yLabel: 'V_L (V)',
      points: 1,
      // NOTE: schema currently supports one y-column per plot. To overlay V_L from both circuits
      // we either (a) add two plots side by side or (b) extend the schema to support multi-series.
      // TODO(austin): decide whether multi-series plots warrant a schema extension this phase.
    },
    {
      kind: 'plot',
      plotId: 'vLoadVsRLoadThPlot',
      sourceTableId: 'verificationTable',
      xCol: 'rLoad',
      yCol: 'vL_th',
      xLabel: 'R_L (Ω)',
      yLabel: 'V_L Thevenin (V)',
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'percentAgreementCalculation',
      prompt:
        'For each load resistance, compute the percent difference between V_L measured with the original network and V_L measured with the Thevenin equivalent. Report the mean percent difference across all loads. Comment on whether the agreement is within expected measurement precision.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: '## Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck1',
      prompt:
        '1. The original network has 5 components (2 batteries, 3 resistors). The Thevenin equivalent has 2 (1 battery, 1 resistor). What information about the original network is **lost** in the Thevenin reduction? What information is **preserved**?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt:
        "2. Thevenin's Theorem is a theorem about **linear** two-terminal networks. Give an example of a circuit element that would break the theorem and briefly explain why. Hint: think about non-ohmic devices from the Ohm's Law lab.",
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt:
        "3. In Part 3 you computed R_th by short-circuiting the terminals and dividing V_th by I_sc. There is an alternative method: deactivate every independent source (replace each battery with a wire) and compute the equivalent resistance seen looking back into the terminals. Try this method on your network and compare the result to your measured R_th. Show your work.",
      rows: 6,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        "4. (Optional, +1 pt extra credit) Why is Thevenin's Theorem useful? Describe one practical application — for example, in audio amplifier design, sensor interfacing, or power systems analysis — where reducing a complex network to its Thevenin equivalent simplifies design or analysis.",
      rows: 5,
    },
    {
      kind: 'instructions',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric found in the Course Information module on Canvas. Comment specifically on the agreement (or disagreement) between the original network and the Thevenin equivalent under load.',
      rows: 8,
      points: 5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include Student Info, all worksheet responses, both circuit screenshots, the verification data table, both V_L vs R_L plots, and a Process Record appendix.',
      ].join('\n\n'),
    },
  ],
};

/** @deprecated reserved alias slot in case test code wants `theveninsTheoremLab` without prefix. */
export const theveninsTheoremLab = phy132TheveninsTheoremLab;
