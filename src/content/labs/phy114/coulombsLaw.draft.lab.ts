// PHY 114 variant of the PHY 132 Coulomb's Law lab.
//
// Derived from phy132/coulombsLaw.draft.lab.ts. PHY 114 is algebra-based and
// does NOT cover experimental uncertainty or error propagation, so this copy
// removes the 132 version's uncertainty content:
//   - the "and its uncertainty (Delta A / sigma_A)" slope-reading clauses,
//   - the Delta A uncertainty rows in the slope multiMeasurement blocks,
//   - the "discuss sources of uncertainty" clause in the conclusion prompt.
// Percent-error-vs-accepted comparisons are algebra-appropriate and KEPT.
//
// If the 132 source changes, re-sync this copy by hand (the two are
// intentionally independent files, one per course).
import type { Lab, NumericRow } from '@/domain/schema';

export const phy114CoulombsLawLab: Lab = {
  id: 'coulombsLaw',
  title: "Coulomb's Law",
  description:
    "Use the Coulomb's Law PhET simulation to investigate how electric force depends on charge magnitude and on separation distance.",
  category: 'Physics',
  simulations: {
    coulombsLaw: {
      title: "Coulomb's Law",
      url: 'https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_all.html',
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
      tocLabel: "Background: Coulomb's Law",
      html: `## Background: Coulomb's Law

The electrostatic force between two point charges is a non-contact force. Its magnitude depends on the product of the charges and the inverse square of the distance between them:

$$F = k\\,\\frac{|Q_1 Q_2|}{d^{2}}$$

where $k$ is **Coulomb's constant**:

$$k \\approx 8.988 \\times 10^{9}\\,\\mathrm{N}\\cdot\\mathrm{m}^{2}/\\mathrm{C}^{2}.$$

---

### A note on units

You'll be working on the **Atomic Scale** screen of the PhET sim, which uses two units you may not have seen before.

**Elementary charge ($\\mathrm{e}$).** The magnitude of charge on a single proton (positive) or electron (negative):

$$1\\,\\mathrm{e} \\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}.$$

So a charge of $-3\\,\\mathrm{e}$ has the same magnitude as three protons' worth of charge, but negative. That is equivalent to three electrons.

**Picometer ($\\mathrm{pm}$).** A length unit:

$$1\\,\\mathrm{pm} = 10^{-12}\\,\\mathrm{m}.$$

This is the natural length scale of atomic systems; a hydrogen atom's Bohr radius is about $53\\,\\mathrm{pm}$.

> [!IMPORTANT]
> Coulomb's constant $k$ is in SI units ($\\mathrm{N \\cdot m^{2} / C^{2}}$). When you extract $k$ from your data later, you'll need to convert your charges from $\\mathrm{e}$ to $\\mathrm{C}$ and your distances from $\\mathrm{pm}$ to $\\mathrm{m}$. The Givens panels give you the values; the Calculation prompts will walk you through the conversion.

---

### What you'll do

You'll collect data from the PhET *Coulomb's Law* simulation in two parts.

**Part 2A.** Hold $Q_1$ and $d$ constant (given), vary $Q_2$, plot $F$ vs $Q_2$, and use the slope to back out a value for $k$.

**Part 2B.** Hold $Q_1$ and $Q_2$ constant (given), vary $d$, plot $F$ vs $d$, $F$ vs $1/d$, and $F$ vs $1/d^2$, and use the linear plot to back out a second value for $k$.

Then compare both experimental values of $k$ against the accepted value.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2A: Investigating Force and Charge',
    },
    {
      kind: 'instructions',
      tocLabel: 'Givens: Part 2A',
      html: `> [!NOTE]
> **Givens: Part 2A.** Use these values throughout Part 2A.
>
> | Symbol | Value | Role |
> |---|---|---|
> | $Q_1$ | $-3\\,\\mathrm{e}$ | constant (fixed across all measurements) |
> | $d$ | $600\\,\\mathrm{pm}$ | constant separation between charges |
> | $Q_2$ | $+1\\,\\mathrm{e},\\ +2\\,\\mathrm{e},\\ +3\\,\\mathrm{e},\\ +4\\,\\mathrm{e},\\ +5\\,\\mathrm{e}$ | **vary** across your five measurements |
>
> Reminder: $\\mathrm{e}$ is the elementary charge ($\\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}$); $\\mathrm{pm}$ is a picometer ($10^{-12}\\,\\mathrm{m}$).`,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 1.** Open the *Coulomb's Law* sim and switch to the **Atomic Scale** screen (toggle at the bottom of the sim; *not* the Macro Scale screen).

Set $Q_1$ and the separation $d$ to the values given above, then transcribe them into the fields below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'constantChargeQ1', label: 'Constant charge $Q_1$', unit: 'e' },
        { id: 'constantDistanceD', label: 'Constant distance $d$', unit: 'pm' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 2.** Take a screenshot of your initial sim setup (both charges visible, with the force reading shown) and attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part2AImage',
      captionFieldId: 'part2ACaption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 3.** Step $Q_2$ through the five values given above ($+1\\,\\mathrm{e}$ through $+5\\,\\mathrm{e}$), keeping $Q_1$ and $d$ fixed.

Record the force $F$ shown by the sim at each value of $Q_2$. The sim will display the force in whatever SI submultiple is convenient; note the unit it gives you and stay consistent across rows.`,
    },
    {
      kind: 'dataTable',
      tableId: 'forceChargeTable',
      rowCount: 5,
      columns: [
        { id: 'charge', label: 'Charge $Q_2$ (e)', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'force', label: 'Force $F$', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 4.** Plot Force $F$ (y) vs. Charge $Q_2$ (x).

Add a proportional fit ($y = Ax$), since Coulomb's Law predicts the line passes through the origin.`,
    },
    {
      kind: 'plot',
      plotId: 'forceVsChargeGraphContainer',
      sourceTableId: 'forceChargeTable',
      xCol: 'charge',
      yCol: 'force',
      xLabel: 'Q₂ (e)',
      yLabel: 'Force F',
      title: 'Force vs. Charge',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 5.** Read off the slope $A$ from the proportional fit.`,
    },
    {
      kind: 'measurement',
      fieldId: 'forceChargeSlopeA',
      label: '$A =$',
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'coulombsConstantCalculation',
      prompt:
        "**Step 6.** Use $A$ to calculate your own value of Coulomb's constant $k$.\n\n> [!TIP]\n> **Setting up the equation.** Set Coulomb's law and your graph's equation equal to each other:\n>\n> $F = k\\,|Q_1 Q_2|/d^2 = A\\,Q_2.$\n>\n> You have known values for $Q_1$, $d$, and $A$, so solve for $k$.\n\n---\n\n> [!IMPORTANT]\n> **Unit conversion.** The accepted $k$ is in SI units, so convert before plugging in:\n>\n> - charges from $\\mathrm{e}$ to coulombs: $1\\,\\mathrm{e} \\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}$\n> - distance from $\\mathrm{pm}$ to meters: $1\\,\\mathrm{pm} = 10^{-12}\\,\\mathrm{m}$\n> - force into $\\mathrm{N}$\n\n---\n\nShow all of your work, then compute the percent error against the accepted value:\n\n$$k \\approx 8.988 \\times 10^{9}\\,\\mathrm{N}\\cdot\\mathrm{m}^{2}/\\mathrm{C}^{2}.$$",
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: `## Concept Check Question

> [!WARNING]
> If you are not confident with your answer, stop and reach out for help before moving on.`,
    },
    {
      kind: 'concept',
      fieldId: 'forceChargeVariationQuestion',
      prompt:
        'How would the force have changed if you kept $Q_2$ constant and varied $Q_1$ instead?',
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Inverse-Square Law',
      html: `## Background: The Inverse-Square Framing

Coulomb's Law predicts that force scales as $1/d^2$ when the charges are held constant. A direct $F$-vs-$d$ plot will be a curve: useful for visual comparison, but not linear.

---

### The trick

To verify the inverse-square law, plot $F$ against $1/d$ and against $1/d^2$, then look for which one is linear. The plot that lands on a straight line through the origin is the relationship that holds.

> [!NOTE]
> Comparing $F$-vs-$1/d$ to $F$-vs-$1/d^2$ helps rule out a simple $1/d$ dependence: the two curves diverge.

---

You'll generate all three plots in Part 2B and use the linear one to extract a second experimental value of $k$.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2B: Investigating Force and Distance',
    },
    {
      kind: 'instructions',
      tocLabel: 'Givens: Part 2B',
      html: `> [!NOTE]
> **Givens: Part 2B.** Use these values throughout Part 2B.
>
> | Symbol | Value | Role |
> |---|---|---|
> | $Q_1$ | $+2\\,\\mathrm{e}$ | constant (fixed across all measurements) |
> | $Q_2$ | $+5\\,\\mathrm{e}$ | constant (fixed across all measurements) |
> | $d$ | $200\\,\\mathrm{pm},\\ 300\\,\\mathrm{pm},\\ 400\\,\\mathrm{pm},\\ 500\\,\\mathrm{pm},\\ 600\\,\\mathrm{pm}$ | **vary** across your five measurements |
>
> Stay on the **Atomic Scale** screen of the sim. Same unit reminders as Part 2A.`,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 1.** Confirm you're still on the **Atomic Scale** screen of the sim.

Set $Q_1$ and $Q_2$ to the values given above, then transcribe them into the fields below. (You'll vary $d$ in the data table; no need to commit to a single $d$ here.)`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'constantChargeQ1Second', label: 'Constant charge $Q_1$', unit: 'e' },
        { id: 'constantChargeQ2', label: 'Constant charge $Q_2$', unit: 'e' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 2.** Step the distance $d$ through the five values given above ($200\\,\\mathrm{pm}$ through $600\\,\\mathrm{pm}$). Record the force $F$ shown by the sim at each value of $d$ (note its unit and stay consistent across rows). The $1/d$ and $1/d^2$ columns are computed automatically.`,
    },
    {
      kind: 'dataTable',
      tableId: 'forceDistanceTable',
      rowCount: 5,
      columns: [
        { id: 'distance', label: 'Distance $d$ (pm)', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'inverseDistance',
          label: 'Inverse Distance $(1/d)$',
          formulaLabel: '$1/d$',
          kind: 'derived',
          deps: ['distance'],
          precision: 4,
          formula: (row: NumericRow): number => {
            const d = row.distance ?? 0;
            return 1 / d;
          },
        },
        {
          id: 'inverseDistanceSquared',
          label: 'Inverse Distance Squared $(1/d^2)$',
          formulaLabel: '$1/d^2$',
          kind: 'derived',
          deps: ['distance'],
          precision: 4,
          formula: (row: NumericRow): number => {
            const d = row.distance ?? 0;
            return 1 / (d * d);
          },
        },
        { id: 'force', label: 'Force $(F)$', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 3.** Make three plots:

- $F$ vs $d$ (for visual comparison only; expect a curve)
- $F$ vs $1/d$
- $F$ vs $1/d^2$

Then add a proportional fit ($y = Ax$) to the $F$ vs $1/d^2$ plot.`,
    },
    {
      kind: 'plot',
      plotId: 'forceVsDistanceGraphContainer',
      sourceTableId: 'forceDistanceTable',
      xCol: 'distance',
      yCol: 'force',
      xLabel: 'd (pm)',
      yLabel: 'Force F',
      title: 'Force vs. Distance',
      points: 1,
    },
    {
      kind: 'plot',
      plotId: 'forceVsInverseDistanceGraphContainer',
      sourceTableId: 'forceDistanceTable',
      xCol: 'inverseDistance',
      yCol: 'force',
      xLabel: '1/d (1/pm)',
      yLabel: 'Force F',
      title: 'Force vs. 1/d',
      points: 1,
    },
    {
      kind: 'plot',
      plotId: 'forceVsInverseDistanceSquaredGraphContainer',
      sourceTableId: 'forceDistanceTable',
      xCol: 'inverseDistanceSquared',
      yCol: 'force',
      xLabel: '1/d² (1/pm²)',
      yLabel: 'Force F',
      title: 'Force vs. 1/d²',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Step 4.** Read off the slope $A$ from the $F$ vs $1/d^2$ proportional fit.`,
    },
    {
      kind: 'measurement',
      fieldId: 'forceDistanceSlopeA',
      label: '$A =$',
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'coulombsConstantCalculationSecond',
      prompt:
        "**Step 5.** Use $A$ to calculate your second experimental value of Coulomb's constant $k$.\n\n> [!TIP]\n> **Setting up the equation.** With $x = 1/d^2$, your graph's line equation is\n>\n> $F = A \\cdot (1/d^2),$\n>\n> and Coulomb's law gives\n>\n> $F = k\\,|Q_1 Q_2|/d^2.$\n>\n> Setting them equal yields $k\\,|Q_1 Q_2| = A$. Solve for $k$.\n\n---\n\n> [!IMPORTANT]\n> **Unit conversion.** The slope $A$ you read off the plot is in whatever units you used on each axis. Before extracting $k$, convert:\n>\n> - charges from $\\mathrm{e}$ to coulombs: $1\\,\\mathrm{e} \\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}$\n> - distances from $\\mathrm{pm}$ to meters: $1\\,\\mathrm{pm} = 10^{-12}\\,\\mathrm{m}$\n> - force into $\\mathrm{N}$\n\n---\n\nShow your work, then compute the percent error against the accepted value:\n\n$$k \\approx 8.988 \\times 10^{9}\\,\\mathrm{N}\\cdot\\mathrm{m}^{2}/\\mathrm{C}^{2}.$$",
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: `## Concept Check Questions

> [!WARNING]
> If you are not confident with your answer, stop and reach out for help before moving on.`,
    },
    {
      kind: 'concept',
      fieldId: 'coulombsLawDistanceQuestion',
      prompt: "According to Coulomb's Law, what happens to the force when the distance is doubled?",
      rows: 4,
      points: 0.75,
    },
    {
      kind: 'concept',
      fieldId: 'coulombsLawLinearQuestion',
      prompt: "Which plot shows a linear relationship? How does this confirm Coulomb's Law?",
      rows: 4,
      points: 0.75,
    },
    {
      kind: 'instructions',
      html: '## Discussion & Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        "Write your discussion & conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize your key findings from both parts of the lab, explain how your results confirm or refute the inverse-square framing of Coulomb's Law, draw parallels between Newton's Law of Gravitation and Coulomb's Law.)",
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
