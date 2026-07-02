// PHY 114 variant of the PHY 132 Kirchhoff's Laws & Power lab.
//
// Derived from phy132/kirchhoffsLaws.draft.lab.ts. PHY 114 is algebra-based
// and does NOT cover calculus, so this copy replaces the 132 version's
// symbolic maximum-power-transfer derivation (setting dP_R/dR = 0) with an
// empirical graph-reading analysis:
//   - the Part 2B background's "you will derive in Part 2B" now reads
//     "you will read off your graph in Part 2B",
//   - the maximumPowerTransferDerivation calculation block is replaced by a
//     maximumPowerTransferReading concept block (read the peak off the
//     P_R vs R plot, compare to r and to the fit parameter B, state the
//     R = r rule, and check eps^2/(4r) against the observed peak power),
//   - the Stereo System part (a) cross-reference now points at "the rule you
//     found from your graph" instead of "the calculation above",
//   - Part 2B procedure step 5 drops the "(with their 1 sigma uncertainties)"
//     reading clause (114 carries no uncertainty content; the powerTransfer
//     fit itself is algebra-appropriate and KEPT).
// There is no uncertainty content to strip in the 132 source.
//
// If the 132 source changes, re-sync this copy by hand (the two are
// intentionally independent files, one per course).
import type { Lab, NumericRow } from '@/domain/schema';

export const phy114KirchhoffsLawsLab: Lab = {
  id: 'kirchhoffsLaws',
  title: "Kirchhoff's Laws & Power",
  description:
    "Apply Kirchhoff's voltage and current laws to a two-battery, two-loop DC circuit, then study power delivery from a non-ideal battery to a variable load and verify the maximum-power-transfer theorem.",
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
      tocLabel: "Background: Kirchhoff's Voltage and Current Laws",
      pdfHidden: true,
      html: `## Background: Kirchhoff's Voltage and Current Laws

Two conservation laws govern every DC circuit, no matter how tangled. Together they are called **Kirchhoff's rules**.

**Kirchhoff's Current Law (KCL)** is the rule for *junctions* (points where three or more wires meet). Conservation of charge requires that the total current flowing **into** a junction equals the total current flowing **out**:

$$\\sum I_{\\text{in}} = \\sum I_{\\text{out}}$$

Equivalently, if you label every branch current with a reference direction and treat currents flowing *into* the junction as positive and *out* as negative, the signed sum is zero.

---

**Kirchhoff's Voltage Law (KVL)** is the rule for *closed loops*. Conservation of energy requires that the algebraic sum of the potential changes around any closed loop is zero:

$$\\sum_{\\text{loop}} \\Delta V = 0$$

When you traverse the loop in your chosen direction:

- A battery contributes $+\\varepsilon$ if you cross it from the $-$ terminal to the $+$ terminal, and $-\\varepsilon$ in the opposite direction.
- A resistor contributes $-IR$ if you traverse it in the **same** direction as the current $I$ in that branch, and $+IR$ in the opposite direction.

A two-loop circuit has two independent loops, so you can write two KVL equations. A circuit with $N$ junctions has $N-1$ independent KCL equations. Together these are enough algebra to solve for every unknown current.

In Part 2A you will build a two-battery, three-resistor, two-loop circuit, read off the currents and voltages from the sim, and verify both rules directly.`,
    },
    {
      kind: 'instructions',
      html: "### Part 2A: Testing Kirchhoff's Voltage Law and Current Law",
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Build the two-loop circuit specified in the Set of Parameters: two batteries with EMFs $\\varepsilon_1$ and $\\varepsilon_2$ and three resistors $R_1$, $R_2$, $R_3$ arranged so that there are two independent loops sharing a single middle branch. Label your branch currents $I_1$, $I_2$, $I_3$ on the diagram with reference directions. Label the top and bottom nodes where three wires meet as the two junctions.

**Procedure step 2.** Take a screenshot of the circuit with all resistance values, battery voltages, and the ammeter / voltmeter readings visible. Attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part2AImage',
      captionFieldId: 'part2ACaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Record the component values you set in the sim, then move on to recording the currents and voltages measured by the meters.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'eps1', label: 'EMF ε₁ =' },
        { id: 'eps2', label: 'EMF ε₂ =' },
        { id: 'r1Value', label: 'Resistance R₁ =' },
        { id: 'r2Value', label: 'Resistance R₂ =' },
        { id: 'r3Value', label: 'Resistance R₃ =' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 4.** With the ammeter, measure the current in each of the three branches ($I_1$, $I_2$, $I_3$). With the voltmeter, measure the voltage across each of the three resistors ($V_1$, $V_2$, $V_3$).

Pay attention to **signs**: if the meter reads a negative value, that means the actual current (or potential drop) is opposite to your assumed reference direction. Record the signed value.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'i1', label: 'Branch current I₁ =' },
        { id: 'i2', label: 'Branch current I₂ =' },
        { id: 'i3', label: 'Branch current I₃ =' },
        { id: 'v1', label: 'Voltage across R₁ (V₁) =' },
        { id: 'v2', label: 'Voltage across R₂ (V₂) =' },
        { id: 'v3', label: 'Voltage across R₃ (V₃) =' },
      ],
      points: 1.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'currentLawEquations',
      prompt:
        '**Procedure step 5.** Add the currents entering and exiting the **top** junction and show that they are equal (i.e., the signed sum is zero). Then do the same for the **bottom** junction. Show your work.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'voltageLawEquations',
      prompt:
        '**Procedure step 6.** Show that the sum of voltage changes around **Loop 1** is zero, then do the same for **Loop 2**. Use your chosen traversal direction for each loop, and remember the sign convention (rise across a battery from $-$ to $+$, drop across a resistor when traversed with the current). Show your work.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Internal Resistance and Maximum Power Transfer',
      pdfHidden: true,
      html: `## Background: Internal Resistance and Maximum Power Transfer

An ideal battery maintains a fixed terminal voltage no matter how much current you draw from it. Real batteries do not. Every real source can be modeled as an ideal EMF $\\varepsilon$ in series with a small **internal resistance** $r$ that lives inside the battery itself.

When you connect a load resistance $R$ across the terminals of a real battery, the same current $I$ flows through both $r$ and $R$. Kirchhoff's loop rule gives:

$$\\varepsilon = I r + I R \\quad\\Longrightarrow\\quad I = \\frac{\\varepsilon}{R + r}$$

The **power delivered to the load** is then:

$$P_R = I^{2} R = \\frac{\\varepsilon^{2}\\,R}{(R + r)^{2}}\\tag{13}$$

Equation (13) has an interesting shape. When $R \\ll r$ the bottom dominates and $P_R \\to 0$. When $R \\gg r$ the top dominates linearly while the bottom dominates quadratically, so again $P_R \\to 0$. Somewhere in between is a **maximum**. The **maximum-power-transfer theorem** says that this maximum occurs at a specific value of $R$ that you will read off your graph in Part 2B.

In Part 2B you will sweep $R$ through 15 values bracketing the internal resistance $r$, plot the load power $P_R$ vs. the load resistance $R$, and extract experimental values of $\\varepsilon$ and $r$ from a custom fit of equation (13).`,
    },
    {
      kind: 'instructions',
      html: '### Part 2B: Power Delivery with a Non-ideal Battery',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Build the circuit specified in the Set of Parameters: a battery with a small but non-zero source resistance $r$ in series with a single variable load resistor $R$. Set the wire resistivity in the sim's options panel so that the wires themselves contribute negligibly compared to the source and load resistances (see the Set of Parameters for the recommended setting). Place an ammeter to read the loop current and a voltmeter across the load resistor.

**Procedure step 2.** Take a screenshot of the circuit with the source resistance, the wire resistivity, and the battery voltage values visible. Attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part2BImage',
      captionFieldId: 'part2BCaption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Step the load resistance $R$ through the following 15 values, recording the corresponding **load voltage** $V_R$ across the load and the **loop current** $I$ for each setting. The load-power column $P_R = V_R \\cdot I$ is computed automatically.

Use these 15 load-resistance values in order, one per row:

$$R = 1.0,\\ 1.5,\\ 2.0,\\ 2.5,\\ 3.0,\\ 3.5,\\ 4.0,\\ 5.0,\\ 6.0,\\ 7.0,\\ 8.0,\\ 9.0,\\ 10.0,\\ 20.0,\\ 40.0\\ \\Omega$$`,
    },
    {
      kind: 'dataTable',
      tableId: 'powerTable',
      rowCount: 15,
      columns: [
        {
          id: 'resistance',
          label: 'Load Resistance R (Ω)',
          kind: 'input',
        },
        {
          id: 'voltage',
          label: 'Load Voltage V_R (V)',
          kind: 'input',
        },
        { id: 'current', label: 'Loop Current I (A)', kind: 'input' },
        {
          id: 'power',
          label: 'Load Power P_R (W)',
          formulaLabel: 'Load Power (V_R × I)',
          kind: 'derived',
          deps: ['voltage', 'current'],
          precision: 4,
          formula: (row: NumericRow): number => {
            const v = row.voltage ?? 0;
            const i = row.current ?? 0;
            return v * i;
          },
        },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Plot **Load Power $P_R$ (y) vs. Load Resistance $R$ (x)**. The curve should rise from the origin, peak somewhere, and fall again at large $R$ -- exactly the shape predicted by equation (13).',
    },
    {
      kind: 'plot',
      plotId: 'powerGraph',
      sourceTableId: 'powerTable',
      xCol: 'resistance',
      yCol: 'power',
      xLabel: 'R (Ω)',
      yLabel: 'P_R (W)',
      title: 'Load Power vs. Load Resistance',
      fits: [{ id: 'powerTransfer', label: 'Power transfer (P = A·R/(R + B)²)' }],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 5.** On the plot above, choose **Power transfer (P = A·R/(R + B)²)** from the fit menu. This fits your data to the model $P_R = A \\cdot R / (R + B)^{2}$, where $A = \\varepsilon^{2}$ and $B = r$. Read the best-fit parameters $A$ and $B$ from the fit summary under the plot and record them below.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'customFitA', label: 'A =', unit: 'V²' },
        { id: 'customFitB', label: 'B =', unit: 'Ω' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'batteryVoltageCalculation',
      prompt:
        'Use the custom-fit parameter $A$ to calculate the experimental battery EMF, $\\varepsilon_{\\text{exp}} = \\sqrt{A}$. Then compute its percent error relative to the EMF you set in the simulation. Show your work.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'sourceResistanceCalculation',
      prompt:
        'Compare the custom-fit parameter $B = r_{\\text{exp}}$ to the source resistance $r$ you set in the sim. Calculate the percent error.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'maximumPowerTransferReading',
      prompt:
        'From your plot of $P_R$ vs. $R$, read off the load resistance at which the delivered power is greatest. Compare that resistance to the source resistance $r$ you set in the sim (and to your fit parameter $B$). State the general rule this suggests for **maximum power transfer**: at what value of $R$, relative to $r$, is the delivered power a maximum? As a numerical check, compute $\\varepsilon^{2}/(4r)$ using your sim values and compare it to the peak power on your graph.',
      rows: 5,
      points: 2,
    },
    {
      kind: 'instructions',
      tocLabel: 'Stereo System Problem',
      html: `## Stereo System Problem

Suppose you're building a custom stereo system and you decide to use an amplifier with an effective DC voltage of 24 V and internal resistance of 4 Ω. You're all about that bass (no treble), so you will only connect a single subwoofer to the amplifier and nothing else.`,
    },
    {
      kind: 'concept',
      fieldId: 'stereoSystemPartA',
      prompt:
        "(a) Since you obviously want the subwoofer to be as loud as possible (meaning it consumes the most power), what should be the value of the subwoofer's resistance? Justify briefly using the maximum-power-transfer rule you found from your graph above.",
      rows: 3,
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'stereoSystemPartB',
      prompt:
        '(b) Calculate the power consumed by the subwoofer at the resistance you chose in part (a), then calculate the total power output of the circuit (subwoofer + internal source). Take the ratio between these values to calculate the **efficiency** $\\eta = P_R / P_{\\text{total}}$. Show your work.',
      equationEditor: true,
      points: 1.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'stereoSystemPartC',
      prompt:
        '(c) Suppose you accidentally used the wrong subwoofer with a resistance of 36 Ω. Calculate the power consumed by the subwoofer, the total power output of the circuit, and the efficiency in this case. Show your work.',
      equationEditor: true,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'stereoSystemPartD',
      prompt:
        '(d) When is the most power delivered to the subwoofer? When is the circuit the most efficient? Are the conditions for maximum power and maximum efficiency mutually exclusive? Explain.',
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
        "Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how your Part 2A data verify KCL and KVL within measurement precision; how the Part 2B power curve confirms or refutes the maximum-power-transfer theorem; how your experimental $\\varepsilon$ and $r$ from the custom fit compare to the sim's set values; the practical implications of the efficiency-vs-power-delivered tradeoff highlighted by the Stereo System problem.)",
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
