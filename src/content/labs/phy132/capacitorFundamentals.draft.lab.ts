// Split from phy132/capacitors.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Parts 1A (predict C, Q, U for
// a single capacitor), 1B (distance dependence), and 1C (area dependence) --
// the parallel-plate-fundamentals half of the source draft.
//
// Restructure decisions:
// - JIT theory delivery: parallel-plate capacitance C = epsilon0 * A / d plus
//   energy U = (1/2) C V^2 surfaced before Part 1A; how varying d affects C
//   (held-Q vs held-V framing) surfaced before Part 1B; how varying A affects
//   C surfaced before Part 1C. Manual Introduction equations (1)-(3) and the
//   simulation behavior are the source for these blocks.
// - Procedure-step lead-ins consolidated into `concept.preamble` where the
//   following block is a concept; for multiMeasurement / dataTable /
//   measurement / image blocks (which the schema does not give a `preamble`
//   field) the procedure step lives in a preceding
//   `instructions { tocHidden: true }` block, matching the coulombsLaw and
//   pointCharge convention.
// - Three <RecordTable> placeholders from the source draft ported to dataTable
//   schema blocks: a 1-row predicted-vs-simulated comparison table for Part 1A
//   (columns: C, Q, U; "predicted" vs "simulated" sub-rows folded into a
//   single 2-row table with a "value type" label column); a 2-row distance
//   comparison table for Part 1B (held-V case: C, Q, U at d_1 vs d_2);
//   a 2-row area comparison table for Part 1C (same shape as 1B but for area).
// - Standalone "Concept Check Questions" divider boxes dropped (chargeBuildup
//   / chargeConfigurations convention). Concept-check question prompts
//   themselves retained in full (synthesis, not observation).
// - Duplicate prompts on resultsAnalysis, dischargeObservation, and
//   areaDischargeObservation de-duplicated.
// - Field-ID renames for uniqueness: `plateDistance` in Part 1A renamed to
//   `initialPlateDistance` to avoid a collision with the (now renamed) Part 1B
//   `initialPlateDistance` row. Same treatment for `plateArea` between Parts
//   1A and 1C: the Part 1A row keeps the bare `plateArea` id and Part 1C uses
//   `initialPlateArea` / `newPlateArea`.
// - Em dashes stripped from HTML/preamble strings; paragraph breaks added.
// - "Set of Parameters" references in the body text are intentionally LEFT IN
//   PLACE. The interim Givens-markdown migration from the handoff is
//   superseded by the per-user-randomized-givens spec; body-text references
//   will be replaced by structured givens at that point. Do not inline
//   parameter values here.
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance is a future per-concept-block feature.
import type { Lab } from '@/domain/schema';

export const phy132CapacitorFundamentalsLab: Lab = {
  id: 'capacitorFundamentals',
  title: 'Capacitor Fundamentals',
  description:
    'Use the PhET Capacitor Lab: Basics simulation to predict and verify the capacitance, stored charge, and stored energy of a parallel-plate capacitor, and to observe how those quantities change when the plate separation or plate area is varied.',
  category: 'Physics',
  simulations: {
    capacitorLabBasics: {
      title: 'Capacitor Lab Basics',
      url: 'https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_all.html',
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
      tocLabel: 'Background: Parallel-Plate Capacitance and Energy',
      pdfHidden: true,
      html: `## Background: Parallel-Plate Capacitance and Energy

A **capacitor** is a pair of conductors held a fixed distance apart that stores energy in the electric field between them. The simplest case is two flat parallel plates of area $A$ separated by a distance $d$, with vacuum (or air) between them.

The **capacitance** $C$ of such a parallel-plate capacitor is set entirely by its geometry:

$$C = \\frac{\\varepsilon_{0} A}{d} \\tag{2}$$

where $\\varepsilon_{0} \\approx 8.854 \\times 10^{-12}\\,\\mathrm{F/m}$ is the permittivity of free space. The SI unit of capacitance is the **farad** (F), defined as one coulomb per volt.

When a capacitor is connected to a battery of voltage $V$, charge $Q$ flows onto the plates until the potential difference across them matches the battery's. The charge on the top plate, the voltage, and the capacitance are linked by the defining relation:

$$Q = C\\,V \\tag{1}$$

The capacitor also stores **electrical potential energy** $U$ in the field between its plates. Three equivalent expressions follow from $Q = CV$:

$$U = \\tfrac{1}{2}\\,C V^{2} = \\tfrac{1}{2}\\,Q V = \\tfrac{1}{2}\\,\\frac{Q^{2}}{C} \\tag{3}$$

In Part 1A you'll use these three equations to predict $C$, $Q$, and $U$ for a single parallel-plate capacitor at a given plate separation $d$, plate area $A$, and battery voltage $V$, then compare your predictions against the values the PhET sim reports. You'll also discharge the capacitor through a lightbulb and time how long it takes for the bulb to go dark. The discharge duration tracks the **capacitance** (a larger $C$ holds more charge at a given voltage and takes longer to empty through the bulb), while the bulb's initial brightness tracks the starting **voltage** across the plates. Keep both observations in mind: you'll repeat the discharge in Parts 1B and 1C and use the changes as evidence of how $C$ and $V$ shifted.

In Parts 1B and 1C you'll then change $d$ or $A$ *after disconnecting the battery* from the capacitor. With the battery disconnected, no charge can flow on or off the plates, so $Q$ is locked at its Part 1A value. You'll predict how $C$, $V$, and $U$ shift under that constraint.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1A: Capacitance, Charge, and Stored Energy',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Capacitor Lab: Basics* sim and select the **Light Bulb** screen (you'll stay on this screen for all of Part 1). Use the three-position wire switch to connect the capacitor to the battery (left wire position). Check the boxes for **Top Plate Charge**, **Stored Energy**, **Electric Field**, and **Plate Charges** so the meters are visible.

Use the on-screen sliders (green arrows for $d$ and $A$; battery slider for $V$) to set plate separation, plate area, and battery voltage to the values in your Set of Parameters. Place a voltmeter and confirm the voltage across the plates matches the battery's.

Record the three input values you used below. These will be your reference (initial) values for Parts 1B and 1C.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'initialPlateDistance', label: 'Plate separation d =' },
        { id: 'initialPlateArea', label: 'Plate area A =' },
        { id: 'voltage', label: 'Battery voltage V =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'calculationsExplanation',
      prompt:
        '**Procedure step 2.** Using equations (1), (2), and (3) above, compute the predicted **capacitance** $C$, **top plate charge** $Q$, and **stored energy** $U$ from your values of $d$, $A$, and $V$. Show your substitutions and intermediate results for each of the three quantities.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Read the simulated values of $C$, $Q$, and $U$ off the three on-screen meters and record them alongside your predicted values in the table below.`,
    },
    {
      kind: 'dataTable',
      tableId: 'predictedVsSimulatedTable',
      rowCount: 2,
      columns: [
        {
          id: 'valueType',
          label: 'Source (predicted vs. simulated)',
          kind: 'input',
        },
        { id: 'capacitance', label: 'Capacitance C', kind: 'input' },
        { id: 'charge', label: 'Top plate charge Q', kind: 'input' },
        { id: 'energy', label: 'Stored energy U', kind: 'input' },
      ],
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'resultsAnalysis',
      prompt:
        'Do your calculated values agree with the simulated values? How do you know? Quote a representative percent error for each of $C$, $Q$, and $U$.',
      rows: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 4.** With the capacitor fully charged by the battery, flip the wire switch to the right position so the capacitor discharges through the lightbulb. Start a stopwatch the instant you flip the switch and stop it when the voltmeter reads 0.000 V. Record the discharge time below to the nearest tenth of a second. You'll use this number as a baseline for Parts 1B and 1C.`,
    },
    {
      kind: 'measurement',
      fieldId: 'dischargeTime',
      label: 'Time to discharge the capacitor through the lightbulb: Δt =',
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Varying the Plate Separation',
      pdfHidden: true,
      html: `## Background: How Plate Separation Affects Capacitance

Equation (2) says capacitance is *inversely proportional* to plate separation: pull the plates apart and $C$ drops; push them closer and $C$ rises.

What happens to the stored charge $Q$ when you change $d$ depends on **what you hold fixed**:

- **Battery still connected (fixed $V$).** $Q = CV$, so if $C$ drops then $Q$ drops too: charge flows back into the battery. The stored energy $U = \\tfrac{1}{2}CV^{2}$ also drops.
- **Battery disconnected (fixed $Q$).** No charge can flow on or off the plates, so $Q$ stays at its initial value. Now $V = Q/C$ rises when $C$ drops, and $U = \\tfrac{1}{2}\\,Q^{2}/C$ rises too. (You did work pulling the plates apart against their mutual attraction, and that work went into the field.)

**In Part 1B you'll disconnect the battery first, then change $d$, so you're in the fixed-$Q$ case.** Predict the direction of change for $C$, $V$, and $U$ before reading the sim's meters.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1B: Distance Dependence',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Recharge the capacitor to the Part 1A state if needed (left wire position with the battery), then flip the wire switch to the **middle position** to disconnect the capacitor from the battery. Leave $A$ at its Part 1A value.

Now change the plate separation $d$ to the new value given in your Set of Parameters by dragging the green arrow. Record the old and new separations below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'distancePart1BInitial', label: 'Initial plate separation (same as Part 1A) =' },
        { id: 'distancePart1BNew', label: 'New plate separation (see Set of Parameters) =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Read $C$, $Q$, and $U$ off the on-screen meters for both the initial separation (Part 1A value) and the new separation. Enter both rows in the table below.`,
    },
    {
      kind: 'dataTable',
      tableId: 'distanceComparisonTable',
      rowCount: 2,
      columns: [
        {
          id: 'separationLabel',
          label: 'Plate separation (initial vs. new)',
          kind: 'input',
        },
        { id: 'capacitance', label: 'Capacitance C', kind: 'input' },
        { id: 'charge', label: 'Top plate charge Q', kind: 'input' },
        { id: 'energy', label: 'Stored energy U', kind: 'input' },
      ],
      points: 1.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Flip the wire switch to the right position to discharge the capacitor through the lightbulb. Time the discharge with a stopwatch, just like in Part 1A. Record the new discharge time below.`,
    },
    {
      kind: 'measurement',
      fieldId: 'newDischargeTime',
      label: 'Time to discharge the capacitor through the lightbulb at the new separation: Δt =',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'dischargeObservation',
      prompt:
        'Was the time to discharge the capacitor less than or greater than the time you measured in Part 1A? Was the lightbulb dimmer or brighter? Note: you do not need to explain why at this point, just describe your observations.',
      rows: 5,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'capacitanceChangeExplanation',
      prompt:
        'Did the capacitance increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: see equation (2) in the background section above.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'chargeChangeExplanation',
      prompt:
        'Did the top plate charge increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: the battery is disconnected, so no charge can flow on or off the plates.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'energyChangeExplanation',
      prompt:
        'Did the stored energy increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: pick the form of equation (3) that uses $Q$ and $C$ (since $Q$ is locked by the disconnected battery), and reason about which factor changed.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Varying the Plate Area',
      pdfHidden: true,
      html: `## Background: How Plate Area Affects Capacitance

Equation (2) also says capacitance is *directly proportional* to plate area: make the plates bigger and $C$ goes up; shrink them and $C$ goes down.

As in Part 1B, you'll disconnect the battery before changing $A$, so you're again in the fixed-$Q$ case. With $Q$ locked:

- $V = Q/C$ falls as $C$ rises.
- $U = \\tfrac{1}{2}\\,Q^{2}/C$ also falls as $C$ rises.

In Part 1C you'll change the plate area while keeping $d$ fixed and the battery disconnected, then repeat the same predict-and-discharge exercise from Part 1B.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1C: Area Dependence',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Reset the simulation, then recharge the capacitor to its Part 1A state (left wire position with the battery). Flip the wire switch to the **middle position** to disconnect the battery. Leave $d$ at its Part 1A value.

Now change the plate area $A$ to the new value given in your Set of Parameters by dragging the green arrow. Record the old and new areas below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'areaPart1CInitial', label: 'Initial plate area (same as Part 1A) =' },
        { id: 'areaPart1CNew', label: 'New plate area (see Set of Parameters) =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Read $C$, $Q$, and $U$ off the on-screen meters for both the initial area (Part 1A value) and the new area. Enter both rows in the table below.`,
    },
    {
      kind: 'dataTable',
      tableId: 'areaComparisonTable',
      rowCount: 2,
      columns: [
        {
          id: 'areaLabel',
          label: 'Plate area (initial vs. new)',
          kind: 'input',
        },
        { id: 'capacitance', label: 'Capacitance C', kind: 'input' },
        { id: 'charge', label: 'Top plate charge Q', kind: 'input' },
        { id: 'energy', label: 'Stored energy U', kind: 'input' },
      ],
      points: 1.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Discharge the capacitor through the lightbulb at the new plate area. Record the new discharge time below.`,
    },
    {
      kind: 'measurement',
      fieldId: 'newAreaDischargeTime',
      label: 'Time to discharge the capacitor through the lightbulb at the new area: Δt =',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'areaDischargeObservation',
      prompt:
        'Was the time to discharge the capacitor less than or greater than the time you measured in Part 1A? Was the lightbulb dimmer or brighter? Note: you do not need to explain why at this point, just describe your observations.',
      rows: 5,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'areaCapacitanceChangeExplanation',
      prompt:
        'Did the capacitance increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: see equation (2) in the background section above.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'areaChargeChangeExplanation',
      prompt:
        'Did the top plate charge increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: the battery is disconnected, so no charge can flow on or off the plates.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'areaEnergyChangeExplanation',
      prompt:
        'Did the stored energy increase, decrease, or stay the same compared to Part 1A? Explain why that makes sense. Hint: pick the form of equation (3) that uses $Q$ and $C$ (since $Q$ is locked by the disconnected battery), and reason about which factor changed.',
      rows: 4,
      points: 0.5,
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
        'Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how well your Part 1A predictions of $C$, $Q$, and $U$ matched the simulated values; how varying plate separation and plate area affected each of those quantities with the battery disconnected (fixed $Q$); and what the discharge observations (duration and initial bulb brightness) imply about how the capacitance and the starting voltage changed in each part.)',
      rows: 12,
      points: 6,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      pdfHidden: true,
      html: `## PDF Report Notes

The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.

Review your entries before export. The signed report is the submission artifact for grading.`,
    },
  ],
};
