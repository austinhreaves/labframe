import type { Lab } from '@/domain/schema';

// PHY 112 recitation exercise 5: resistor voltage drops and currents in series vs
// parallel; voltmeter-vs-ammeter placement. Tier A lab; student-facing conversion
// of phy112_rec_ex05_soln.docx with all answers stripped. See
// docs/PHY112_TIER_AB_SPEC.md Section 8, Chunk 2 for the section outline and the
// per-question point values preserved below.
//
// Figure note: the five Part figures in public/phy112/ are extracted from the
// solution key and currently carry answer annotations (+/- polarity labels,
// current-direction loop arrows, drawn E and v field arrows, an already-placed
// second ammeter, node and branch-current labels). Each embed is preceded by a
// `TODO(human)` comment describing what must be removed before student release.
// See public/phy112/FIGURES.md and Section 11.2 of the spec.

export const phy112ResistorsSeriesParallelLab: Lab = {
  id: 'resistorsSeriesParallel',
  title: 'Resistors in Series and Parallel',
  description:
    'Build single-resistor, two-resistor series, and two-resistor parallel circuits in the Circuit Construction Kit AC Virtual Lab. Measure voltage drops and currents with voltmeters and ammeters, and use the patterns to deduce how voltage and current divide in series and parallel and where each meter should be placed.',
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
      html: `## Simulation Setup

Open the Circuit Construction Kit: AC - Virtual Lab simulation linked above. For this exercise you will only need wires, a battery, and resistors from the right-hand toolbox, plus the voltmeter and ammeter from the meters tray.

Set the following options before you begin:

- Show the battery as a schematic symbol rather than a cartoon cell.
- Set the wire resistivity to the smallest available value (labelled "tiny" on the slider).
- Leave the battery voltage at its default value unless a Part instructs you otherwise.

Use the voltmeter (the meter with two leads) to read voltage drops, and the ammeter (the meter that clips into a wire) to read currents.`,
    },

    // -------------------------------------------------------------- Part I
    {
      kind: 'instructions',
      html: `## Part I: A Single Resistor

Build the circuit shown below: a single 50 ohm resistor connected to the battery by wires.`,
    },
    // TODO(human): replace ex05_part1_single_resistor_circuit.png with a clean
    // version. The current file has +/- polarity labels on the battery and the
    // resistor and a current-direction loop arrow labelled I drawn on it; Part I.1
    // asks the student to add those annotations themselves.
    {
      kind: 'instructions',
      html: `![Part I single-resistor circuit](/phy112/ex05_part1_single_resistor_circuit.png)

---

**1.** On the circuit diagram above, label the positive and negative terminals of the battery and the high- and low-potential sides of the resistor. Draw an arrow showing the direction of conventional current and label it I.

Use the voltmeter to measure the voltage drop across the battery and across the resistor, and record each reading below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p1BatteryV', label: 'Voltage drop across the battery', unit: 'V' },
        { id: 'p1ResistorV', label: 'Voltage drop across the resistor', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p1VoltageCompare',
      prompt:
        'How does the voltage drop across the battery compare to the voltage drop across the resistor? Briefly explain why this makes sense.',
      rows: 3,
      points: 1,
    },

    {
      kind: 'instructions',
      html: `---

**2.** Background. The battery does work to separate positive and negative charge, holding the positive terminal at a higher potential than the negative terminal. When the circuit is closed, the resulting potential difference drives positive charge around the external loop, from the positive terminal, through the wire and resistor, and back to the negative terminal.

**3.** Inside the resistor, that potential difference produces an electric field E that points from the high-potential side to the low-potential side. A positive charge moving through the resistor feels an electric force in the direction of E, so its velocity v also points from high to low potential through the resistor.

On the resistor figure below, draw and label:

- a red arrow showing the direction of the electric field E inside the resistor,
- a blue arrow showing the direction of motion v of a positive charge through the resistor,
- the high-potential (+) and low-potential (-) ends of the resistor.

Upload a photo or screenshot of your annotated figure.`,
    },
    // TODO(human): replace ex05_part1_resistor_field_arrows.png with a clean
    // backdrop. The current figure already has the red E-field arrow and the blue
    // v arrow drawn in and the +/- labels in place, which is exactly what the
    // student is being asked to add. A blank resistor symbol (no arrows, no
    // polarity labels) is needed for student release.
    {
      kind: 'instructions',
      html: `![Resistor diagram for the E-field question](/phy112/ex05_part1_resistor_field_arrows.png)`,
    },
    {
      kind: 'image',
      imageId: 'p1FieldDiagram',
      captionFieldId: 'p1FieldDiagramCaption',
      maxMB: 5,
    },
    {
      kind: 'concept',
      fieldId: 'p1FieldDirection',
      prompt:
        'In one sentence, explain why E inside the resistor points from the high-potential side to the low-potential side.',
      rows: 2,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p1ChargeDirection',
      prompt:
        'In one sentence, explain why a positive charge inside the resistor moves in the same direction as E.',
      rows: 2,
      points: 1,
    },

    {
      kind: 'instructions',
      html: `---

**4.** Charge is conserved, so the rate at which charge enters the resistor must equal the rate at which it leaves. Test this directly: place one ammeter in the wire just before the resistor and a second ammeter in the wire just after the resistor.`,
    },
    // TODO(human): replace ex05_part1_ammeter_placement.png with a clean version.
    // The current figure already shows one ammeter placed, a current-direction
    // arrow, and +/- polarity labels; the student is supposed to add the second
    // ammeter and label the current direction and terminals themselves.
    {
      kind: 'instructions',
      html: `![Ammeter placement on the single-resistor circuit](/phy112/ex05_part1_ammeter_placement.png)

Record the two ammeter readings.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p1CurrentBefore', label: 'Current measured before the resistor', unit: 'A' },
        { id: 'p1CurrentAfter', label: 'Current measured after the resistor', unit: 'A' },
      ],
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p1ChargeConservation',
      prompt:
        'How do the two currents compare, and how does that result follow from conservation of charge?',
      rows: 3,
      points: 1,
    },

    // -------------------------------------------------------------- Part II
    {
      kind: 'instructions',
      html: `## Part II: Two Resistors in Series

Modify the circuit so a second resistor R2 is wired in series with the original resistor R1, on the same single loop with the battery.`,
    },
    // TODO(human): replace ex05_part2_two_resistors_series.png with a clean
    // version. The current figure has +/- polarity labels on the battery and on
    // both resistors and a current-direction loop arrow drawn in; the student is
    // supposed to add all of those annotations.
    {
      kind: 'instructions',
      html: `![Two resistors in series](/phy112/ex05_part2_two_resistors_series.png)

---

**1.** On the diagram, label the battery terminals, the high- and low-potential sides of each resistor, and the direction of conventional current around the loop.

Use the voltmeter to measure the voltage drop across the battery and across each resistor, and record the readings below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p2BatteryV', label: 'Voltage drop across the battery', unit: 'V' },
        { id: 'p2R1V', label: 'Voltage drop across R1', unit: 'V' },
        { id: 'p2R2V', label: 'Voltage drop across R2', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p2VoltagePattern',
      prompt:
        'Describe the pattern you see relating the battery voltage to the two resistor voltages. State the rule in words.',
      rows: 3,
      points: 1,
    },
    {
      kind: 'instructions',
      html: `---

**2.** Use the ammeter to measure the current through each resistor in turn. Place the meter directly in series with R1, record the reading, then move it into the loop next to R2 and record again.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p2R1Current', label: 'Current through R1', unit: 'A' },
        { id: 'p2R2Current', label: 'Current through R2', unit: 'A' },
      ],
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p2CurrentCompare',
      prompt:
        'How do the two currents compare? State the rule for current through resistors wired in series.',
      rows: 3,
      points: 1,
    },

    // -------------------------------------------------------------- Part III
    {
      kind: 'instructions',
      html: `## Part III: Two Resistors in Parallel

Rebuild the circuit so R1 and R2 are wired in parallel: each resistor sits on its own branch between the same two nodes that connect to the battery.`,
    },
    // TODO(human): replace ex05_part3_two_resistors_parallel.png with a clean
    // version. The current figure has +/- polarity labels, the node labelled n,
    // and three current arrows (I1, I2, I3) drawn in; the student is supposed to
    // add the labels and arrows.
    {
      kind: 'instructions',
      html: `![Two resistors in parallel](/phy112/ex05_part3_two_resistors_parallel.png)

---

**1.** Trace each independent loop you can follow through this circuit starting and ending at the positive terminal of the battery. Describe each loop in words.`,
    },
    {
      kind: 'concept',
      fieldId: 'p3LoopsDescription',
      prompt:
        'Describe the independent loops in this circuit. Identify which components each loop passes through.',
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      html: `---

**2.** Use the voltmeter to measure the voltage drop across the battery and across each resistor.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p3BatteryV', label: 'Voltage drop across the battery', unit: 'V' },
        { id: 'p3R1V', label: 'Voltage drop across R1', unit: 'V' },
        { id: 'p3R2V', label: 'Voltage drop across R2', unit: 'V' },
      ],
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'p3VoltagePattern',
      prompt:
        'Describe the pattern relating the battery voltage to the two resistor voltages in this circuit. State the rule in words.',
      rows: 3,
      points: 1,
    },
    {
      kind: 'instructions',
      html: `---

**3.** Use the ammeter to measure the current leaving the battery and the current through each resistor branch. Label the branch through R1 as I1 and the branch through R2 as I2; call the current leaving the battery I3.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'p3BatteryCurrent', label: 'I3, current leaving the battery', unit: 'A' },
        { id: 'p3R1Current', label: 'I1, current through R1', unit: 'A' },
        { id: 'p3R2Current', label: 'I2, current through R2', unit: 'A' },
      ],
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p3NodeRule',
      prompt:
        'Compare the current entering the node where the branches meet to the sum of the currents leaving it. State the rule for currents at a node and explain how it follows from conservation of charge.',
      rows: 4,
      points: 1,
    },

    // -------------------------------------------------------------- Part IV
    {
      kind: 'instructions',
      html: `## Part IV: Summary

Use your measurements from Parts II and III to summarize how voltage and current behave for resistors in series and for resistors in parallel. Then summarize what your placements taught you about voltmeters and ammeters.`,
    },
    {
      kind: 'concept',
      fieldId: 'p4Summary',
      prompt: `Fill in the four blanks with "the same" or "different":

- For resistors in series, the voltage across each resistor is ____ and the current through each resistor is ____.
- For resistors in parallel, the voltage across each resistor is ____ and the current through each resistor is ____.`,
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p4MeterPlacement',
      prompt:
        'Based on how you used the meters in this lab, where should a voltmeter be placed in a circuit to read the voltage across a component, and where should an ammeter be placed to read the current through it? Refer to series vs parallel connection in your answer.',
      rows: 4,
      points: 1,
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
