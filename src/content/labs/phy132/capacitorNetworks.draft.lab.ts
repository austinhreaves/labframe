// Split from phy132/capacitors.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Parts 2A (three parallel
// capacitors sharing charges) and 2B (series + parallel mix sharing charges) —
// the multi-capacitor network half of the source draft.
//
// Restructure decisions:
// - JIT theory delivery: equivalent capacitance for series vs. parallel
//   networks plus conservation of charge in capacitor-sharing problems
//   surfaced up front in a single Background block before Part 2A. Part 2B
//   gets a brief one-block refresher noting that series and parallel
//   combinations can be nested.
// - Procedure-step lead-ins consolidated into preceding
//   `instructions { tocHidden: true }` blocks for image / dataTable blocks
//   (which the schema does not give a `preamble` field), and folded directly
//   into calculation `prompt` strings where the calculation is the next block.
//   Matches the coulombsLaw + pointCharge convention.
// - Two <RecordTable> placeholders from the source draft ported to dataTable
//   schema blocks. Part 2A's table is a 3-row × 3-column comparison of the
//   voltage across each of the three parallel capacitors (V_1, V_2, V_3) at
//   each of the three sharing steps (A, B, C) called for in the original lab,
//   matching the "12 voltages × 3 caps × 3 steps" legacy structure (the 12th
//   cell is the battery voltage V_0, captured in a separate single
//   measurement block above the table). Part 2B's table is a 2-row × 4-column
//   comparison of voltages across C_1, C_2, C_3, and the equivalent
//   capacitance C_23 for the series-of-two case across the two sharing steps
//   (A, B) the source draft mentions, matching the legacy "8 voltages"
//   structure.
// - Standalone "Concept Check Questions" divider boxes dropped (chargeBuildup
//   convention).
// - Duplicate prompt on discussionConclusion de-duplicated.
// - Em dashes stripped from HTML/preamble strings; paragraph breaks added.
// - "Set of Parameters" references in the body text are intentionally LEFT IN
//   PLACE. The interim Givens-markdown migration from the handoff is
//   superseded by the per-user-randomized-givens spec; body-text references
//   will be replaced by structured givens at that point. Do not inline
//   parameter values here.
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance is a future per-concept-block feature.
import type { Lab } from '@/domain/schema';

export const phy132CapacitorNetworksLab: Lab = {
  id: 'capacitorNetworks',
  title: 'Capacitor Networks',
  description:
    'Use the PhET Circuit Construction Kit: AC simulation to build small capacitor networks, predict how an initial charge redistributes when a charged capacitor is switched to share with one or more uncharged capacitors, and compare against measured voltages.',
  category: 'Physics',
  simulations: {
    circuitConstructionKitAc: {
      title: 'Circuit Construction Kit: AC',
      url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_all.html',
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
      tocLabel: 'Background: Capacitor Networks and Charge Sharing',
      pdfHidden: true,
      html: `## Background: Capacitor Networks and Charge Sharing

When two or more capacitors are wired together, they behave like a single **equivalent capacitor** whose value depends on how they are combined.

**Parallel combination.** Capacitors wired in parallel all share the same voltage across them. Their charges add, so their capacitances add:

$$C_{\\text{parallel}} = C_{1} + C_{2} + C_{3} + \\dots$$

**Series combination.** Capacitors wired in series carry the same charge on each (charge has nowhere else to go in the chain). Their voltages add, so their *reciprocals* add:

$$\\frac{1}{C_{\\text{series}}} = \\frac{1}{C_{1}} + \\frac{1}{C_{2}} + \\frac{1}{C_{3}} + \\dots$$

**Charge sharing.** Suppose a single capacitor $C_{1}$ is first charged up by a battery to voltage $V_{0}$ (carrying charge $Q_{0} = C_{1} V_{0}$), then disconnected from the battery and connected instead to one or more *uncharged* capacitors. The total charge in the isolated system is conserved: it redistributes itself across all the capacitors until every node is at a single common voltage.

For a parallel sharing problem (charged $C_{1}$ in parallel with uncharged $C_{2}$, $C_{3}$, ...), the post-sharing voltage on every capacitor is:

$$V_{\\text{shared}} = \\frac{Q_{0}}{C_{1} + C_{2} + C_{3} + \\dots}$$

For a mixed series-parallel sharing problem, replace the series sub-block with its equivalent capacitance $C_{\\text{eq}}$ first, then treat the rest as a parallel sharing problem. The voltage across the equivalent capacitor then splits across the original series components in inverse proportion to their capacitances (because they carry the same charge: $V = Q / C$).

In Part 2A you'll work through a three-parallel-capacitor sharing problem with three switching steps. In Part 2B you'll repeat the exercise for a mixed series-plus-parallel network.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2A: Sharing Charges (Three Parallel Capacitors)',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Circuit Construction Kit: AC* sim. Build the three-parallel-capacitor sharing circuit described in your Set of Parameters: a battery of voltage $V_{0}$ that can charge capacitor $C_{1}$, plus a switch arrangement that lets you (a) charge only $C_{1}$, then (b) connect $C_{1}$ in parallel with $C_{2}$ only, then (c) connect $C_{1}$ in parallel with both $C_{2}$ and $C_{3}$.

Use the values of $V_{0}$, $C_{1}$, $C_{2}$, and $C_{3}$ from your Set of Parameters.

**Procedure step 2.** Record the battery voltage you used, then take a screenshot of the completed setup with the values shown and attach it below with a brief caption.`,
    },
    {
      kind: 'measurement',
      fieldId: 'part2ABatteryVoltage',
      label: 'Battery voltage V₀ =',
      points: 0.5,
    },
    {
      kind: 'image',
      imageId: 'parallelCapacitorsImage',
      captionFieldId: 'parallelCapacitorsCaption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Run through the three switching steps and record the voltage across each of the three capacitors at each step. Use a voltmeter from the sim's tool palette. The switches are opened and closed *in this order*; charge is only ever redistributed within whichever capacitors are currently connected.

- **Step A.** Close $S_{1}$ ($S_{2}$ and $S_{3}$ open). $C_{1}$ is connected to the battery alone; $C_{2}$ and $C_{3}$ are isolated and uncharged.
- **Step B.** Open $S_{1}$, then close $S_{2}$ ($S_{3}$ stays open). $C_{1}$ is now disconnected from the battery and shares its charge with $C_{2}$ only. $C_{3}$ is still isolated.
- **Step C.** Open $S_{2}$, then close $S_{3}$. $C_{2}$ now shares its (Step-B) charge with $C_{3}$. $C_{1}$ is isolated from the rest and holds its Step-B voltage.

Enter the nine voltage readings (3 capacitors × 3 steps) in the table below.`,
    },
    {
      kind: 'dataTable',
      tableId: 'parallelCapacitorsTable',
      rowCount: 3,
      columns: [
        {
          id: 'step',
          label: 'Sharing step (A / B / C)',
          kind: 'input',
        },
        {
          id: 'voltageC1',
          label: 'Voltage across C₁',
          kind: 'input',
        },
        {
          id: 'voltageC2',
          label: 'Voltage across C₂',
          kind: 'input',
        },
        {
          id: 'voltageC3',
          label: 'Voltage across C₃',
          kind: 'input',
        },
      ],
      points: 2,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'voltageCalculations',
      prompt:
        '**Procedure step 4.** Predict the voltage across each capacitor at each of the three sharing steps. Use conservation of charge: at each switching event, the total charge on whichever capacitors are currently connected together is conserved as it redistributes, and the connected capacitors end up at the same final voltage. Step A is immediate ($V_{C_{1}} = V_{0}$). For Step B, $C_{1}$ (charged to $V_{0}$) shares with $C_{2}$ in parallel. For Step C, $C_{2}$ (now carrying its Step-B charge) shares with $C_{3}$; $C_{1}$ is isolated and retains its Step-B voltage. Show your substitutions. Compute a percent error between each predicted voltage and the corresponding measured value from the table above.',
      equationEditor: true,
      points: 2.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Mixed Series and Parallel Networks',
      pdfHidden: true,
      html: `## Background: Mixing Series with Parallel

Most real capacitor networks combine series and parallel sub-blocks. The recipe is the same as for resistors: collapse the network inward, one sub-block at a time, replacing each series or parallel cluster with its equivalent capacitance until a single equivalent remains.

For Part 2B, you'll have a charged $C_{1}$ that you then share with the **series combination of $C_{2}$ and $C_{3}$**. Replace $C_{2}$ and $C_{3}$ with their series equivalent

$$C_{23} = \\left(\\frac{1}{C_{2}} + \\frac{1}{C_{3}}\\right)^{-1}$$

and then treat the problem as charge sharing between $C_{1}$ (charged to $V_{0}$) and $C_{23}$ (initially uncharged) in parallel. Once you know the post-sharing voltage across the parallel combination, the same charge $Q_{23}$ sits on $C_{2}$ and $C_{3}$ individually, so their voltages split in inverse proportion to their capacitances.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2B: Sharing Charges (Series and Parallel)',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Modify your circuit (or build a new one) per your Set of Parameters: a battery of voltage $V_{0}$ that can charge $C_{1}$, plus a switch arrangement that lets you connect the charged $C_{1}$ to the **series pair $C_{2}$ + $C_{3}$**.

Use the values of $V_{0}$, $C_{1}$, $C_{2}$, and $C_{3}$ from your Set of Parameters (they may be different from the Part 2A values).

**Procedure step 2.** Record the battery voltage and take a screenshot of the completed setup with values shown. Attach it below with a brief caption.`,
    },
    {
      kind: 'measurement',
      fieldId: 'part2BBatteryVoltage',
      label: 'Battery voltage V₀ =',
      points: 0.5,
    },
    {
      kind: 'image',
      imageId: 'seriesParallelCapacitorsImage',
      captionFieldId: 'seriesParallelCapacitorsCaption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Run through the two switching steps and record the voltages across each of $C_{1}$, $C_{2}$, $C_{3}$, and the series combination $C_{23}$.

- **Step A.** $C_{1}$ is connected to the battery alone; $C_{2}$ and $C_{3}$ are isolated and uncharged.
- **Step B.** $C_{1}$ is disconnected from the battery and connected to the series pair $C_{2}$ + $C_{3}$.

For each step, measure the voltage across each of the four labeled elements (the voltage across $C_{23}$ is the voltage across the series pair taken together, i.e., across the outer two nodes). Enter the eight voltage readings (4 elements × 2 steps) in the table below.`,
    },
    {
      kind: 'dataTable',
      tableId: 'seriesParallelCapacitorsTable',
      rowCount: 2,
      columns: [
        {
          id: 'step',
          label: 'Sharing step (A / B)',
          kind: 'input',
        },
        {
          id: 'voltageC1',
          label: 'Voltage across C₁',
          kind: 'input',
        },
        {
          id: 'voltageC2',
          label: 'Voltage across C₂',
          kind: 'input',
        },
        {
          id: 'voltageC3',
          label: 'Voltage across C₃',
          kind: 'input',
        },
        {
          id: 'voltageC23',
          label: 'Voltage across C₂₃ (series pair)',
          kind: 'input',
        },
      ],
      points: 2,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'voltageCalculationsSeries',
      prompt:
        '**Procedure step 4.** Predict the voltage across each of $C_{1}$, $C_{2}$, $C_{3}$, and $C_{23}$ at each of the two sharing steps. Start by replacing the series pair with its equivalent capacitance $C_{23} = (1/C_{2} + 1/C_{3})^{-1}$, then apply conservation of charge to the parallel sharing problem between $C_{1}$ and $C_{23}$. Finally, split $V_{C_{23}}$ back across $C_{2}$ and $C_{3}$ in inverse proportion to their capacitances (since they carry the same charge in series). Show your substitutions. Compute a percent error between each predicted voltage and the corresponding measured value.',
      equationEditor: true,
      points: 2.5,
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
        'Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how well your predicted post-sharing voltages matched the measured values in both the all-parallel case and the mixed series-and-parallel case, and what conservation of charge plus the series/parallel combination rules let you predict.)',
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
