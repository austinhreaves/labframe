import type { Lab } from '@/domain/schema';

// PHY 112 Chunk 3 (Tier A): student-facing conversion of recitation exercise 6
// (Kirchhoff loop and junction rules). Source key:
//   phy112_rec_ex06_soln.docx (answer key; all answers stripped).
// Spec: docs/PHY112_TIER_AB_SPEC.md, Section 8 Chunk 3.
// Figures: public/phy112/ (all ex06 figures are clean per FIGURES.md).

export const phy112KirchhoffsRulesLab: Lab = {
  id: 'kirchhoffsRules',
  title: "Kirchhoff's Rules",
  description:
    "Apply Kirchhoff's loop and junction rules to series, parallel, and multiloop circuits. Walk a voltmeter around a loop to verify that rises and drops sum to zero, then measure currents and voltages in a two-battery multiloop circuit.",
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
      kind: 'objective',
      fieldId: 'objective',
      prompt:
        'Explain the goal of the experiment in your own words. Two or three sentences are sufficient.',
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      tocLabel: 'Simulation Setup',
      html: `## Simulation Setup

Open the **Circuit Construction Kit: AC - Virtual Lab** from the simulation picker above.

You will only need wires, batteries, and resistors for this exercise. From the toolbox at the right, use the **voltmeter** (with red and black leads) and the **ammeter** (the in-line meter you splice into a wire). If a battery is shown as a long stack of cells, right-click it and choose the simple **battery symbol** to match the textbook diagrams.

---

> [!NOTE]
> Set the wire resistivity to **tiny** in the sim's options panel so the wires do not contribute a measurable voltage drop.`,
    },

    // -------- Part I: Voltmeter walk around a series loop --------
    {
      kind: 'instructions',
      tocLabel: 'Part I: Voltmeter Walk',
      html: `## Part I: Walking a Voltmeter Around a Series Loop

Build the following circuit in the simulator: a battery connected in series with two resistors, R1 = 50 Ω and R2 = 75 Ω. Use a battery voltage of your choice (a value between 5 V and 20 V works well).

![Part I series circuit with two resistors](/phy112/ex06_part1_two_resistors_series.png)

---

### Background: the voltmeter-walk method

A voltmeter reads the **potential difference** between its red lead and its black lead: V_red minus V_black. To "walk a loop," you anchor the black lead at one point and move the red lead step by step around the circuit, recording the reading at each labeled position. Each step's *change* in the reading tells you whether you crossed a potential **rise** (positive change), a **drop** (negative change), or no change.

Start with both leads touching the same node so the voltmeter reads 0.00 V; that is your reference point.

![Voltmeter leads both at point a, reading 0.00 V](/phy112/ex06_part1_voltmeter_lead_setup.png)

The circuit is labeled with positions **a** through **f** as shown below. Position **a** is your reference (black lead stays there). Walk the red lead through positions **b, c, d, e, f**, and then back to **a**.

![Series circuit with positions a through f labeled](/phy112/ex06_part1_loop_letter_positions.png)`,
    },
    {
      kind: 'instructions',
      html: `### Part I.1: Record the walk

For each red-lead position in the table below, record:

- the **voltmeter reading** at that position (signed value, in V),
- whether the reading was a **Rise**, a **Drop**, or **Unchanged** compared to the previous position,
- the **amount** by which it rose or dropped (in V).

| Red Lead Location | Voltmeter Reading (V) | Rise / Drop / Unchanged | Amount of Rise or Drop (V) |
|---|---|---|---|
| a (start) | 0.00 | — | — |
| b | _enter below_ | _enter below_ | _enter below_ |
| c | _enter below_ | _enter below_ | _enter below_ |
| d | _enter below_ | _enter below_ | _enter below_ |
| e | _enter below_ | _enter below_ | _enter below_ |
| f | _enter below_ | _enter below_ | _enter below_ |
| a (return) | _enter below_ | _enter below_ | _enter below_ |

Enter your numeric voltmeter readings and the magnitude of each change below. Categorize each step (rise, drop, or unchanged) in your written answers for Parts I.3 and I.4.

---

> TODO(human): the schema's \`dataTable\` columns are numeric only (\`input\` or \`derived\`; see \`src/domain/schema/lab.ts\`). The Part I walk needs two text-valued columns (the lead location label and the Rise/Drop/Unchanged categorical), so this section uses Option A from the Chunk 3 brief: a Markdown table skeleton in this \`instructions\` block plus a \`multiMeasurement\` block below for the numeric readings. A schema extension adding a text/categorical column kind would let this collapse to a single \`dataTable\` (open question 11.3 in \`docs/PHY112_TIER_AB_SPEC.md\`).`,
    },
    {
      kind: 'multiMeasurement',
      points: 3,
      rows: [
        { id: 'p1ReadingB', label: 'Reading at b', unit: 'V' },
        { id: 'p1ReadingC', label: 'Reading at c', unit: 'V' },
        { id: 'p1ReadingD', label: 'Reading at d', unit: 'V' },
        { id: 'p1ReadingE', label: 'Reading at e', unit: 'V' },
        { id: 'p1ReadingF', label: 'Reading at f', unit: 'V' },
        { id: 'p1ReadingAReturn', label: 'Reading at a (return)', unit: 'V' },
      ],
    },
    {
      kind: 'multiMeasurement',
      points: 2,
      rows: [
        { id: 'p1AmountAB', label: '|ΔV| from a to b', unit: 'V' },
        { id: 'p1AmountBC', label: '|ΔV| from b to c', unit: 'V' },
        { id: 'p1AmountCD', label: '|ΔV| from c to d', unit: 'V' },
        { id: 'p1AmountDE', label: '|ΔV| from d to e', unit: 'V' },
        { id: 'p1AmountEF', label: '|ΔV| from e to f', unit: 'V' },
        { id: 'p1AmountFA', label: '|ΔV| from f to a', unit: 'V' },
      ],
    },
    {
      kind: 'concept',
      fieldId: 'p1LoopSum',
      prompt:
        'Add up all the rises and drops you recorded around the complete loop (treat drops as negative and rises as positive). What is the sum? What does this tell you about the total change in potential when you return to your starting point?',
      rows: 5,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'p1RiseDropRules',
      prompt: `Based on your walk, complete each statement by filling in **rise**, **drop**, or **unchanged**:

1. When you traverse a battery from the low-potential terminal to the high-potential terminal, the potential ____.
2. When you traverse a length of wire (with negligible resistance), the potential ____.
3. When you traverse a resistor in the **same direction** as the conventional current through it, the potential ____.

Briefly justify each answer (one sentence each is enough).`,
      rows: 8,
      points: 3,
    },
    {
      kind: 'concept',
      fieldId: 'p1ReverseRules',
      prompt: `Now imagine repeating the walk in the **opposite** direction (a, f, e, d, c, b, a). Fill in **rise**, **drop**, or **unchanged** for each:

1. Traversing a battery from the high-potential terminal to the low-potential terminal, the potential ____.
2. Traversing a length of wire, the potential ____.
3. Traversing a resistor in the **opposite** direction to the conventional current through it, the potential ____.

Briefly justify each answer.`,
      rows: 8,
      points: 3,
    },

    // -------- Part II: Multiple loops in a parallel circuit --------
    {
      kind: 'instructions',
      tocLabel: 'Part II: Multiloop Voltage Sums',
      html: `## Part II: Voltage Sums Around Multiple Loops

Now build the parallel circuit shown below, with R1 and R2 wired in parallel across the same battery. Positions **a** through **f** are labeled; three distinct closed loops can be traced: **abcfa**, **abcdefa**, and **fcdef**.

![Parallel circuit with positions a-f and three loops labeled](/phy112/ex06_part2_parallel_loops_labeled.png)

---

For each of the three loops, mentally (or with the voltmeter) walk around the loop and add up the rises and drops, treating drops as negative and rises as positive.`,
    },
    {
      kind: 'concept',
      fieldId: 'p2MultiLoopSum',
      prompt: `What is the sum of the potential changes around each of the three closed loops (**abcfa**, **abcdefa**, **fcdef**)? State your conclusion in one sentence: how does the sum of rises and drops around **any** closed loop relate to the total change in potential?`,
      rows: 6,
      points: 3,
    },

    // -------- Part III: Kirchhoff's rules summary (background only) --------
    {
      kind: 'instructions',
      tocLabel: "Part III: Kirchhoff's Rules",
      html: `## Part III: Kirchhoff's Rules

Your observations in Parts I and II illustrate the two rules that govern every circuit, no matter how complicated.

---

### Loop rule (energy conservation)

> The sum of the potential changes around any closed loop is **zero**.

A charge that travels once around a loop ends up exactly where it started; its potential energy at the end of the trip must equal its potential energy at the start. Every potential rise from a battery is exactly cancelled by an equal total drop across the rest of the loop.

---

### Junction rule (charge conservation)

> The total current flowing **into** any junction equals the total current flowing **out**.

A junction (or node) is a point where three or more wires meet. Charge cannot pile up at a junction, so whatever current enters per second must also leave per second.

---

Together these two rules are called **Kirchhoff's rules**. They let you solve any DC circuit by writing one loop equation per independent loop and one junction equation per independent node, then solving the resulting algebraic system for the unknown currents and voltages.`,
    },

    // -------- Part IV: Multiloop circuit with two batteries --------
    {
      kind: 'instructions',
      tocLabel: 'Part IV: Multiloop Circuit',
      html: `## Part IV: A Two-Battery Multiloop Circuit

Build the circuit shown below: two batteries (ε1 = 5.00 V and ε2 = 25.0 V) and three resistors (R1 = 40 Ω, R2 = 10 Ω, R3 = 80 Ω) arranged in a two-loop network.

![Two-battery multiloop circuit](/phy112/ex06_part4_multiloop_circuit.png)

---

Use the voltmeter and ammeter from the simulator's toolbox to measure the voltage across each battery and each resistor, and the current through each resistor. Record your measurements below. Pay attention to **signs**: if the ammeter reads a negative current, that means the conventional current flows opposite to the reference direction you assumed when you placed the meter.`,
    },
    {
      kind: 'multiMeasurement',
      points: 2,
      rows: [
        { id: 'p4Batt1V', label: 'Voltage across battery 1 (ε1)', unit: 'V' },
        { id: 'p4Batt2V', label: 'Voltage across battery 2 (ε2)', unit: 'V' },
        { id: 'p4R1V', label: 'Voltage across R1', unit: 'V' },
        { id: 'p4R2V', label: 'Voltage across R2', unit: 'V' },
        { id: 'p4R3V', label: 'Voltage across R3', unit: 'V' },
      ],
    },
    {
      kind: 'multiMeasurement',
      points: 2,
      rows: [
        { id: 'p4R1I', label: 'Current through R1', unit: 'A' },
        { id: 'p4R2I', label: 'Current through R2', unit: 'A' },
        { id: 'p4R3I', label: 'Current through R3', unit: 'A' },
      ],
    },
    {
      kind: 'concept',
      fieldId: 'p4ParallelCheck',
      prompt:
        'Are the three resistors in parallel with one another? Use your voltage measurements to justify your answer. (Hint: components are in parallel only if they share the same pair of nodes and therefore the same voltage drop.)',
      rows: 5,
      points: 1,
    },

    // -------- Closing PDF report notes --------
    {
      kind: 'instructions',
      tocHidden: true,
      html: `## PDF Report Notes

The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.

Review your entries before export. The signed report is the submission artifact for grading.`,
    },
  ],
};
