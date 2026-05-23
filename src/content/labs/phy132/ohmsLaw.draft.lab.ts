// Split from phy132/dcCircuits.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Parts 1A (electrical
// continuity), 1B (Ohm's Law with known resistor + pencil), and 1C
// ("Ohm's Suggestion" -- non-ohmic real lightbulb) from the source draft.
//
// Restructure decisions:
// - JIT theory delivery: a brief "Resistance & Conductivity" background
//   surfaces just before Part 1A (motivates eraser / paper-clip / pencil as
//   insulator / conductor / something-in-between, so students have a
//   prediction before they observe). A second background block surfaces
//   V = IR and the ohmic/non-ohmic distinction before Part 1B, since that
//   is where the quantitative work begins and where the 1B vs 1C
//   ohmic-vs-non-ohmic synthesis ultimately lands.
// - Procedure-step lead-ins consolidated into `concept.preamble` where the
//   following block is a concept; for measurement / multiMeasurement /
//   dataTable / image / plot blocks (which the schema does not give a
//   `preamble` field) the procedure step lives in a preceding
//   `instructions { tocHidden: true }` block, matching the coulombsLaw /
//   pointCharge convention.
// - For calculation blocks the procedure-step text is folded into the
//   `prompt` itself (coulombsLaw convention).
// - Two RecordTable / record-style sections in 1A consolidated: the source
//   had a single (V, I) multiMeasurement after the screenshot, which is the
//   "circuit values" reading for Part 1A. Kept as a multiMeasurement; the
//   eraser / paper-clip / pencil per-object observations remain as the
//   three concept blocks (now with procedure-step preambles).
// - Source had a `sourceTableId` typo on the Part 1C plot
//   (`ohmsLawGraph1C` pointed at `'ohmsLaw1CTable'` but the dataTable's
//   tableId was `'ohmsLawData1C'`). Fixed to match the actual dataTable id.
// - Source had no resistance / uncertainty calculation in Part 1C beyond
//   `resistanceCalculation1C` (which only asks for the uncertainty
//   propagation). Kept the source's prompt as-is.
// - The 1B/1C synthesis concept checks (linearRelationshipQuestion,
//   ohmicQuestion, entireSlopeQuestion, sectionSlopeQuestion) compare
//   results across both sub-parts, so they sit AFTER 1C as a synthesis
//   block, matching the source's intent.
// - Standalone "Concept Check Questions" divider blocks dropped
//   (chargeBuildup / coulombsLaw convention).
// - Em dashes stripped from HTML / preamble / prompt strings; paragraph
//   breaks added inside long HTML blocks per Mayer's spatial-contiguity
//   principle.
// - "Set of Parameters" references in the body text are intentionally LEFT
//   IN PLACE. The interim Givens-markdown migration from the handoff is
//   superseded by the per-user-randomized-givens spec (see
//   docs/specs/per-user-randomized-givens.md); body-text references will be
//   replaced by structured givens at that point. Do not inline parameter
//   values here.
// - Manual extraction of the docx was blocked by the sandbox during this
//   pass; prompt text was taken verbatim from the (already manual-derived)
//   source draft. If a downstream review surfaces a manual / source
//   disagreement, the manual wins (per the handoff brief).
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance is a future per-concept-block feature.
import type { Lab } from '@/domain/schema';

export const phy132OhmsLawLab: Lab = {
  id: 'ohmsLaw',
  title: "Continuity & Ohm's Law",
  description:
    "Use the PhET Circuit Construction Kit: DC simulation to test electrical continuity of everyday objects, verify Ohm's Law for a known resistor in series with a pencil, and contrast that ohmic behavior with the non-ohmic I-V curve of a real lightbulb.",
  category: 'Physics',
  simulations: {
    circuitConstructionKitDc: {
      title: 'Circuit Construction Kit: DC',
      url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
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
      kind: 'objective',
      fieldId: 'objective',
      prompt:
        'Explain the goal of the experiment in your own words. Two or three sentences are sufficient.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Resistance and Conductivity',
      html: `## Background: Resistance and Conductivity

An *electric current* is a flow of charge driven by a potential difference. The ease with which charge flows through a given material is captured by its **conductivity**; the inverse property, **resistance**, captures how much that material opposes the flow.

In a simple DC circuit, three behaviors cover most everyday objects:

- **Conductors** (most metals) have very low resistance. Connecting a conductor across a circuit lets current flow freely, often more freely than the rest of the circuit was designed to handle.
- **Insulators** (rubber, dry wood, most plastics) have extremely high resistance. They effectively block current.
- **Resistive materials** sit between the two extremes. A graphite pencil lead is a classic example: it conducts, but not nearly as well as a copper wire.

A **fuse** is a deliberately weak link placed in series with a circuit. When the current exceeds the fuse's rating, the fuse breaks the circuit and protects the rest of the components.

In Part 1A you will test three everyday objects (an eraser, a paper clip, and a pencil) by connecting each in turn into a simple circuit and observing what happens to the current, the voltage, and the fuse.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1A: Electrical Continuity and Conductivity',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Circuit Construction Kit: DC* sim. Build the circuit specified in the Set of Parameters: a battery, a known resistor, and a fuse in series with a switch and a second branch that you can connect different test objects into. See the Set of Parameters for the battery voltage, the known resistance, and the fuse rating.

**Procedure step 2.** Take a screenshot of the circuit with the sim's voltage and current readouts visible and with **nothing** connected to the second branch. Attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part1AImage',
      captionFieldId: 'part1ACaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** With nothing connected to the second branch, record the battery voltage $V$ and the current $I$ shown by the sim.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'batteryVoltage', label: 'V =' },
        { id: 'batteryCurrent', label: 'I =' },
      ],
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'eraserObservation',
      preamble: `**Procedure step 4.** Connect the **eraser** across the second branch and close the switch.

Watch what happens to the current and voltage readings, and to the fuse.

---`,
      prompt:
        'What did you observe when you closed the switch with the eraser connected to the second branch? Did the current/voltage change? Explain why that makes sense.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'paperClipObservation',
      preamble: `**Procedure step 5.** Reset the fuse if it blew. Replace the eraser with the **paper clip** across the second branch and close the switch.

Watch what happens to the current and voltage readings, and to the fuse.

---`,
      prompt:
        'What did you observe when you closed the switch with the paper clip connected to the second branch? What happened to the fuse? Explain why that makes sense.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'pencilObservation',
      preamble: `**Procedure step 6.** Reset the fuse if it blew. Replace the paper clip with the **pencil** (graphite lead) across the second branch and close the switch.

Watch what happens to the current and voltage readings, and to the fuse.

---`,
      prompt:
        'What did you observe when you closed the switch with the pencil connected to the second branch? Did the current/voltage change? Explain why that makes sense.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: "Background: Ohm's Law and Non-Ohmic Materials",
      html: `## Background: Ohm's Law and Non-Ohmic Materials

For many materials and over moderate ranges of current, the voltage $V$ across an object and the current $I$ through it are directly proportional:

$$V = I R$$

where the constant of proportionality $R$ is the object's **resistance**. The SI unit is the ohm ($\\Omega$), equivalent to a volt per ampere. Equivalent forms:

$$I = \\frac{V}{R}, \\qquad R = \\frac{V}{I}$$

A material that obeys this linear relationship over a working range is called **ohmic**. Plotting current $I$ on the vertical axis against voltage $V$ on the horizontal axis for an ohmic device yields a straight line through the origin whose slope is $1/R$.

A **non-ohmic** material does *not* obey $V = IR$ with a single constant $R$. The most familiar example is an incandescent lightbulb. The bulb's filament heats up as more current flows through it; hotter metal has *higher* resistance; so the slope of the $I$-vs-$V$ curve gradually decreases at higher currents. The curve bends.

In Part 1B you will collect $I$-vs-$V$ data for a graphite pencil lead in series with a known resistor, fit a proportional line, and extract the pencil's resistance from the slope. In Part 1C you will repeat the experiment with a real lightbulb replacing the pencil and observe how its non-ohmic behavior changes the shape of the plot.`,
    },
    {
      kind: 'instructions',
      html: "### Part 1B: Ohm's Law",
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Build the circuit specified in the Set of Parameters: a variable-voltage battery in series with a known resistor and a graphite pencil lead. Place an ammeter to read the current through the series loop and a voltmeter to read the voltage across the resistor-pencil combination.

**Procedure step 2.** Record the value of the known resistance below, then take a screenshot of the circuit and attach it to the next box.`,
    },
    {
      kind: 'measurement',
      fieldId: 'knownResistance',
      label: 'Known resistance R =',
      points: 0.25,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Take a screenshot of the circuit you built for measuring the current through and voltage across the known resistor and pencil in series. Attach it below.',
    },
    {
      kind: 'image',
      imageId: 'part1BImage',
      captionFieldId: 'part1BCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 4.** Step the battery voltage through ten values spanning the sim's available range (see the Set of Parameters for the recommended voltages). At each setting, record the voltage $V$ across the series combination and the current $I$ through it.`,
    },
    {
      kind: 'dataTable',
      tableId: 'ohmsLawTable',
      rowCount: 10,
      columns: [
        { id: 'voltage', label: 'Voltage V (V)', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'current', label: 'Current I (A)', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 5.** Plot **Current $I$ (y) vs. Voltage $V$ (x)**. Add a proportional fit ($y = mx$) and a linear fit ($y = mx + b$); for a clean Ohmic device the two should be nearly indistinguishable.',
    },
    {
      kind: 'plot',
      plotId: 'ohmsLawGraph',
      sourceTableId: 'ohmsLawTable',
      xCol: 'voltage',
      yCol: 'current',
      xLabel: 'V (V)',
      yLabel: 'I (A)',
      title: 'Current vs. Voltage (resistor + pencil)',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 6.** Read off the slope $A$ and its uncertainty $\\Delta A$ ($\\sigma_A$) from the proportional fit.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'slopeA', label: 'A =' },
        { id: 'uncertaintyA', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      fieldId: 'resistanceCalculation',
      prompt:
        'From the slope of your $I$-vs-$V$ graph, calculate (1) the total equivalent resistance of the resistor-pencil series combination, and (2) the resistance of the pencil $R_p$ alone. Hint: what are the units of the slope? What are the units of resistance in terms of volts and amps? Show your work.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'uncertaintyCalculation',
      prompt:
        'Propagate the uncertainty $\\Delta A$ in the slope to give the corresponding uncertainty $\\Delta R_p$ in the pencil resistance. Assume the known resistor has zero uncertainty. Show your work.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: "### Part 1C: Ohm's Suggestion?",
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Replace the pencil in the Part 1B circuit with a **real lightbulb** (the sim has a "non-ideal" or "real" bulb option distinct from the ideal bulb). Keep the same known resistor in series. See the Set of Parameters for the bulb settings.

**Procedure step 2.** Record the value of the known resistance below.`,
    },
    {
      kind: 'measurement',
      fieldId: 'knownResistance1C',
      label: 'Known resistance R =',
      points: 0.25,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Take a screenshot of the circuit you built for measuring the current through and voltage across the known resistor and real lightbulb in series. Attach it below.',
    },
    {
      kind: 'image',
      imageId: 'part1CImage',
      captionFieldId: 'part1CCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Sweep the battery voltage through ten values spanning the full available range (see the Set of Parameters). At each setting, record $V$ and $I$ as in Part 1B. **Spread your points evenly across the full voltage range** so that any non-linearity at the high-current end of the data shows clearly.',
    },
    {
      kind: 'dataTable',
      tableId: 'ohmsLawData1C',
      rowCount: 10,
      columns: [
        { id: 'voltage', label: 'Voltage V (V)', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'current', label: 'Current I (A)', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 5.** Plot **Current $I$ (y) vs. Voltage $V$ (x)** for the resistor-and-lightbulb data. Try fitting both a proportional line and a straight line, and look at how well (or poorly) each describes the data.',
    },
    {
      kind: 'plot',
      plotId: 'ohmsLawGraph1C',
      sourceTableId: 'ohmsLawData1C',
      xCol: 'voltage',
      yCol: 'current',
      xLabel: 'V (V)',
      yLabel: 'I (A)',
      title: 'Current vs. Voltage (resistor + real lightbulb)',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 6.** Read off the slope $A$ and its uncertainty $\\Delta A$ from whichever fit you used.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'slopeA1C', label: 'A =' },
        { id: 'uncertaintyA1C', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      fieldId: 'resistanceCalculation1C',
      prompt:
        "Propagate the uncertainty $\\Delta A$ in the slope to give the corresponding uncertainty $\\Delta R_b$ in the real lightbulb's resistance. Assume the known resistor has zero uncertainty. Show your work.",
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'linearRelationshipQuestion',
      prompt:
        'Between Part 1B and Part 1C, which graph reflects a linear relationship between current and voltage? How do you know?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'ohmicQuestion',
      prompt:
        'Is the pencil ohmic or non-ohmic? Is the real lightbulb ohmic or non-ohmic? How do you know? Hint: re-read the background block above on Ohm\'s Law and non-ohmic materials.',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'entireSlopeQuestion',
      prompt:
        "From Part 1C, if you use the slope of the *entire* current vs. voltage graph to calculate the lightbulb's resistance, what would that value represent?",
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'sectionSlopeQuestion',
      prompt:
        'How would your calculation of the lightbulb resistance change if you calculated it using only a small section of the graph at low voltage and current values? How about at high voltage and current?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      tocLabel: 'Discussion and Conclusion',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        "Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize what your Part 1A observations told you about the conductivity of the three test objects; how well your Part 1B data confirm $V = IR$ for the pencil; how the Part 1C lightbulb data deviate from ohmic behavior and what physical mechanism explains the deviation; sources of uncertainty.)",
      rows: 12,
      points: 6,
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
