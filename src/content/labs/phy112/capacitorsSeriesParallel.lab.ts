import type { Lab } from '@/domain/schema';

// Student-facing LabFrame conversion of PHY 112 recitation exercise 4
// (capacitor voltage drops and charge in series vs parallel).
//
// Source key: phy112_rec_ex04_soln.docx (answers stripped).
// See docs/PHY112_TIER_AB_SPEC.md Section 8, Chunk 1 for the section outline
// and per-question point allocation this file implements.

export const phy112CapacitorsSeriesParallelLab: Lab = {
  id: 'capacitorsSeriesParallel',
  title: 'Capacitors in Series and Parallel',
  description:
    'Build single-, series-, and parallel-capacitor circuits in PhET and measure the voltage drop across each element. Use Q = C*deltaV to compare how charge distributes in each configuration.',
  category: 'Physics',
  simulations: {
    circuitConstructionKitAcVirtualLab: {
      title: 'Circuit Construction Kit: AC - Virtual Lab',
      url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_all.html',
      allow: 'fullscreen',
    },
  },
  sections: [
    {
      kind: 'instructions',
      tocHidden: true,
      html: `## Integrity Agreement

Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.`,
    },
    {
      kind: 'instructions',
      html: [
        '## Simulation Setup',
        'Open the Circuit Construction Kit: AC - Virtual Lab simulation embedded above. You only need three components for this exercise: wires, a battery, and capacitors.',
        '',
        'Before you build, configure the sim:',
        '',
        '1. In the right-hand panel, switch the battery symbol to the schematic style (the long-and-short-line symbol). This makes the high-potential and low-potential terminals visible.',
        '2. Set the wire resistivity slider to its smallest value. The recitation treats wires as ideal.',
        '3. Show the values overlay so capacitance and battery voltage are visible on each component.',
        '',
        'You will use the voltmeter from the meter toolbox throughout. The red lead reads the higher potential side and the black lead reads the lower potential side; a positive reading means the red lead is at higher potential.',
      ].join('\n'),
    },

    // ---------------------------------------------------------------------
    // Part I: single capacitor
    // ---------------------------------------------------------------------
    {
      kind: 'instructions',
      html: [
        '## Part I: One Capacitor',
        'Build a single loop containing the battery and one capacitor. Set the battery to a convenient voltage (for example, 9.0 V) and the capacitor to a convenient capacitance (for example, 0.10 F). Record the values you chose in your process record.',
        '',
        '### Background: battery terminal convention',
        'On the schematic battery symbol, the long line is the positive (high-potential) terminal and the short line is the negative (low-potential) terminal. Current in the external circuit flows from + to -; inside the battery the chemical EMF drives charge from - to +.',
        '',
        '### Background: voltmeter lead placement',
        'Place the voltmeter in parallel with whichever element you want to measure. To measure the drop across the battery, touch the red lead to the + terminal and the black lead to the - terminal. To measure the drop across the capacitor, touch the red lead to the plate connected (through wire) to the battery + terminal and the black lead to the plate connected to the battery -.',
        '',
        '---',
        '',
        // TODO(human): replace this figure with a clean unannotated version.
        // The extracted PNG shows the +/- plate labels that the student is
        // supposed to add themselves. See public/phy112/FIGURES.md.
        '![Part I single-capacitor circuit](/phy112/ex04_part1_single_capacitor.png)',
        '',
        'Measure the voltage drop across the battery and across the capacitor. Record both readings below.',
      ].join('\n'),
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p1BatteryV', label: 'Voltage drop across the battery, deltaV_battery =', unit: 'V' },
        { id: 'p1CapacitorV', label: 'Voltage drop across the capacitor, deltaV_C =', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p1VoltageCompare',
      prompt:
        'How does the voltage drop across the battery compare to the voltage drop across the capacitor? Briefly explain what you observed.',
      rows: 3,
      points: 1,
    },

    // ---------------------------------------------------------------------
    // Part II: two capacitors in series
    // ---------------------------------------------------------------------
    {
      kind: 'instructions',
      html: [
        '## Part II: Two Capacitors in Series',
        'Modify your circuit so that the two capacitors C1 and C2 are wired in series with the battery (a single loop: battery, C1, C2, back to the battery). Choose different capacitance values for C1 and C2 and record what you chose.',
        '',
        '---',
        '',
        // TODO(human): replace this figure with a clean unannotated version.
        // The extracted PNG shows +/- labels on the battery and both capacitors
        // that the student is supposed to add. See public/phy112/FIGURES.md.
        '![Part II two capacitors in series](/phy112/ex04_part2_two_capacitors_series.png)',
        '',
        'Measure the voltage drop across the battery and across each capacitor.',
      ].join('\n'),
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p2BatteryV', label: 'Voltage drop across the battery, deltaV_battery =', unit: 'V' },
        { id: 'p2C1V', label: 'Voltage drop across C1, deltaV_C1 =', unit: 'V' },
        { id: 'p2C2V', label: 'Voltage drop across C2, deltaV_C2 =', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p2VoltagePattern',
      prompt:
        'Describe the pattern you see in the three voltage drops. How are the capacitor voltages related to each other, and how do they combine to give the battery voltage?',
      rows: 4,
      points: 2,
    },
    {
      kind: 'calculation',
      fieldId: 'p2ChargeCalc',
      prompt:
        'Using Q = C*deltaV, compute the charge stored on C1 and on C2 from your measured voltages and chosen capacitance values. Show the substitution for each capacitor.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p2ChargeCompare',
      prompt:
        'How does the charge on C1 compare to the charge on C2? Briefly explain why this makes sense for two capacitors wired in series.',
      rows: 3,
      points: 1,
    },

    // ---------------------------------------------------------------------
    // Part III: two capacitors in parallel
    // ---------------------------------------------------------------------
    {
      kind: 'instructions',
      html: [
        '## Part III: Two Capacitors in Parallel',
        'Rewire the circuit so that C1 and C2 are connected in parallel across the battery. Keep the same capacitance values you used in Part II.',
        '',
        '---',
        '',
        // TODO(human): replace this figure with a clean unannotated version.
        // The extracted PNG shows +/- labels on the battery and both capacitors
        // that the student is supposed to add. See public/phy112/FIGURES.md.
        '![Part III two capacitors in parallel](/phy112/ex04_part3_two_capacitors_parallel.png)',
      ].join('\n'),
    },
    {
      kind: 'concept',
      fieldId: 'p3LoopsDescription',
      prompt:
        'The parallel circuit contains three independent loops. Identify each loop by listing the elements it passes through (for example, battery to C1 and back). Describe each loop in one short sentence.',
      rows: 5,
      points: 2,
    },
    {
      kind: 'instructions',
      html: 'Measure the voltage drop across the battery and across each capacitor.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p3BatteryV', label: 'Voltage drop across the battery, deltaV_battery =', unit: 'V' },
        { id: 'p3C1V', label: 'Voltage drop across C1, deltaV_C1 =', unit: 'V' },
        { id: 'p3C2V', label: 'Voltage drop across C2, deltaV_C2 =', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p3VoltagePattern',
      prompt:
        'Describe the pattern you see in the three voltage drops for the parallel circuit. How are the capacitor voltages related to each other and to the battery voltage?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'p3ChargeCalc',
      prompt:
        'Using Q = C*deltaV, compute the charge stored on C1 and on C2 in the parallel circuit. Show the substitution for each capacitor.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p3ChargeCompare',
      prompt:
        'How does the charge on C1 compare to the charge on C2 in the parallel circuit? Briefly explain why this is different from what you saw in Part II.',
      rows: 3,
      points: 1,
    },

    // ---------------------------------------------------------------------
    // Part IV: summary
    // ---------------------------------------------------------------------
    {
      kind: 'instructions',
      html: [
        '## Part IV: Summary',
        'Pull your Part II and Part III results together into a one-paragraph summary of the series-vs-parallel behavior.',
        '',
        'Significant figures note: report measured voltages to the precision the simulation displays, and round computed charges to the same number of significant figures as the least-precise input.',
      ].join('\n'),
    },
    {
      kind: 'concept',
      fieldId: 'p4Summary',
      prompt: [
        'Complete the four statements below by filling in "the same" or "different":',
        '',
        '1. For capacitors in series, the voltage drop across each capacitor is ______.',
        '2. For capacitors in series, the charge on each capacitor is ______.',
        '3. For capacitors in parallel, the voltage drop across each capacitor is ______.',
        '4. For capacitors in parallel, the charge on each capacitor is ______.',
      ].join('\n'),
      rows: 6,
      points: 1,
    },

    // ---------------------------------------------------------------------
    // Part V: three-capacitor follow-up
    // ---------------------------------------------------------------------
    {
      kind: 'instructions',
      html: [
        '## Part V: Three-Capacitor Follow-Up',
        'Build the three-capacitor circuit shown below using the same battery you used earlier. Choose three different capacitance values for C1, C2, and C3 and record your choices.',
        '',
        '---',
        '',
        // TODO(human): replace this figure. The extracted PNG includes a fourth
        // capacitor C4 in parallel with C1, which is the answer to Part V
        // question 2. A clean three-capacitor (C1, C2, C3 only) version is
        // required. See public/phy112/FIGURES.md.
        '![Part V three-capacitor follow-up circuit](/phy112/ex04_part5_three_capacitor_followup.png)',
        '',
        'Measure the voltage drop across the battery and across each capacitor.',
      ].join('\n'),
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p5BatteryV', label: 'Voltage drop across the battery, deltaV_battery =', unit: 'V' },
        { id: 'p5C1V', label: 'Voltage drop across C1, deltaV_C1 =', unit: 'V' },
        { id: 'p5C2V', label: 'Voltage drop across C2, deltaV_C2 =', unit: 'V' },
        { id: 'p5C3V', label: 'Voltage drop across C3, deltaV_C3 =', unit: 'V' },
      ],
    },
    {
      kind: 'calculation',
      fieldId: 'p5ChargeCalc',
      prompt:
        'Compute the charge stored on C1, C2, and C3 using Q = C*deltaV. Show the substitution for each capacitor.',
      equationEditor: true,
    },
    {
      kind: 'concept',
      fieldId: 'p5SeriesParallelId',
      prompt:
        'Using your voltage measurements, identify the configuration of each pair: are C1 and C2 in parallel, are C1 and C3 in parallel, and are C2 and C3 in series? Justify each answer by referring to the pattern of voltage drops you measured.',
      rows: 5,
      points: 1,
    },
    {
      kind: 'image',
      imageId: 'p5FourthCapacitor',
      captionFieldId: 'p5FourthCapacitorCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      html: 'In the upload above, sketch (by hand or in any drawing tool) the Part V circuit with a fourth capacitor C4 added so that it is in parallel with C1. In the caption, describe where you placed C4 and why that location puts it in parallel with C1.',
    },

    {
      kind: 'instructions',
      tocHidden: true,
      html: `## PDF Report Notes

The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.

Review your entries before export. The signed report is the submission artifact for grading.`,
    },
  ],
};
