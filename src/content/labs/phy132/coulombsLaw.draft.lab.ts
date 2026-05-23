// Restructured 2026-05-11 per Austin's content fixes:
// - JIT theory delivery: Coulomb's Law equation surfaced before Part 2A;
//   inverse-square framing surfaced before Part 2B.
// - Procedure steps segmented from data/measurement sections for tighter
//   step → action coupling (segmenting principle).
// - Fixed pre-existing bug: Part 2B multiMeasurement row 2 labeled "Q₂" but
//   keyed as `constantDistanceDSecond`. Renamed to `constantChargeQ2`.
// - Fixed pre-existing bug: discussionConclusion prompt text was duplicated.
// - Concept-check question prompts retained in full (synthesis, not observation).
// - TODO(ai-coaching): the "Concept Check" instruction blocks are the future
//   home of the "Not confident in your answer?" Socratic-prompt affordance.
//   See conversation 2026-05-11 for design notes.
//
// Updated 2026-05-12: inlined Givens (replaces the Canvas "Set of Parameters"
// sheet — extraneous load fix per Mayer's spatial-contiguity principle).
// - Switched from PhET Macro Scale to Atomic Scale. Charges now in units of
//   elementary charge (e); distances in picometers (pm). Distance values
//   scaled by 1e-10 from the original cm values (2-6 pm semantic intent;
//   actual pm values verified against the sim's slider range — see Givens
//   blocks for the final numbers).
// - Givens currently rendered as plain `instructions` blocks with KaTeX.
//   See docs/givens-tooling.md for the structured replacement (Phase 1).
// - Calculation prompts now include an explicit SI-conversion hint, since
//   students entering charges in e and distances in pm need to convert to
//   C and m to recover k in N·m²/C².
import type { Lab, NumericRow } from '@/domain/schema';

export const phy132CoulombsLawLab: Lab = {
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

where **k ≈ 8.988 × 10⁹ N·m²/C²** is Coulomb's constant.

**A note on units.** You'll be working on the **Atomic Scale** screen of the PhET sim, which uses two units you may not have seen before:

- **e** — the *elementary charge*, i.e., the magnitude of charge on a single proton (positive) or electron (negative). $1\\,\\mathrm{e} \\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}$. So a charge of $-3\\,\\mathrm{e}$ has the same magnitude as 3 protons' worth of charge, but negative — equivalent to 3 electrons.
- **pm** — *picometer*, $1\\,\\mathrm{pm} = 10^{-12}\\,\\mathrm{m}$. This is the natural length scale of atomic systems; a hydrogen atom's Bohr radius is about 53 pm.

Coulomb's constant *k* itself is a universal SI-unit quantity ($\\mathrm{N\\cdot m^2 / C^2}$), so when you extract *k* from your data later, you'll need to convert your charges from e to C and your distances from pm to m. The Givens panels below give you the values; the Calculation prompts later will walk you through the conversion.

In this lab you will collect data from the PhET *Coulomb's Law* simulation in two parts:

- **Part 2A** — Hold $Q_1$ and $d$ constant (given), vary $Q_2$, plot $F$ vs $Q_2$, and use the slope to back out a value for $k$.
- **Part 2B** — Hold $Q_1$ and $Q_2$ constant (given), vary $d$, plot $F$ vs $d$, $F$ vs $1/d$, and $F$ vs $1/d^2$, and use the linear plot to back out a value for $k$.

Compare both experimental values of $k$ against the accepted value.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2A: Investigating Force and Charge',
    },
    {
      kind: 'instructions',
      tocLabel: 'Givens — Part 2A',
      // TEMP (2026-05-12): plain-markdown Givens block. Replace with the
      // structured `givens` section kind described in docs/givens-tooling.md
      // once the schema work lands.
      html: `## Givens — Part 2A

Use these values throughout Part 2A:

| Symbol | Value | Role |
|---|---|---|
| $Q_1$ | $-3\\,\\mathrm{e}$ | constant (fixed across all measurements) |
| $d$ | $600\\,\\mathrm{pm}$ | constant separation between charges |
| $Q_2$ | $+1\\,\\mathrm{e},\\ +2\\,\\mathrm{e},\\ +3\\,\\mathrm{e},\\ +4\\,\\mathrm{e},\\ +5\\,\\mathrm{e}$ | **vary** across your five measurements |

Reminder: $\\mathrm{e}$ is the elementary charge ($\\approx 1.602 \\times 10^{-19}\\,\\mathrm{C}$); $\\mathrm{pm}$ is a picometer ($10^{-12}\\,\\mathrm{m}$).`,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Coulomb's Law* sim and switch to the **Atomic Scale** screen (toggle at the bottom of the sim — *not* the Macro Scale screen). Set $Q_1$ and the separation $d$ to the values given above, then transcribe them into the fields below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'constantChargeQ1', label: 'Constant charge Q₁', unit: 'e' },
        { id: 'constantDistanceD', label: 'Constant distance d', unit: 'pm' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Take a screenshot of your initial sim setup (both charges visible, with the force reading shown) and attach it below.`,
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
      html: `**Procedure step 3.** Step $Q_2$ through the five values given above (+1 e through +5 e), keeping $Q_1$ and $d$ fixed. Record the force $F$ shown by the sim at each value of $Q_2$ (the sim will display this in whatever SI submultiple is convenient — note the unit it gives you and stay consistent across rows).`,
    },
    {
      kind: 'dataTable',
      tableId: 'forceChargeTable',
      rowCount: 5,
      columns: [
        { id: 'charge', label: 'Charge Q₂ (e)', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'force', label: 'Force F', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 4.** Plot **Force F (y) vs. Charge Q₂ (x)**. Add a proportional fit (y = Ax) — since Coulomb's Law predicts the line passes through the origin.`,
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
      html: `**Procedure step 5.** Read off the slope A and its uncertainty ΔA (σₐ) from the proportional fit.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'forceChargeSlopeA', label: 'A =' },
        { id: 'forceChargeSlopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      fieldId: 'coulombsConstantCalculation',
      prompt:
        "**Procedure step 6.** Use A to calculate your own value of Coulomb's constant k. (Hint: set Coulomb's law and your graph's equation equal to each other — F = k|Q₁Q₂|/d² = AQ₂. You have known values for Q₁, d, and A, so solve for k.) **Important — unit conversion:** before plugging numbers in, convert your charges from e to coulombs (1 e ≈ 1.602 × 10⁻¹⁹ C), your distance from pm to meters (1 pm = 10⁻¹² m), and your force into N. The accepted k is in SI units. Show all of your work, then compute the percent error against k ≈ 8.988 × 10⁹ N·m²/C².",
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: `## Concept Check Question

If you are not confident with your answer, stop and reach out for help before moving on!`,
    },
    {
      kind: 'concept',
      fieldId: 'forceChargeVariationQuestion',
      prompt: 'How would the force have changed if you kept Q₂ constant and varied Q₁ instead?',
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Inverse-Square Law',
      html: `## Background: The Inverse-Square Framing

Coulomb's Law predicts that force scales as **1/d²** when the charges are held constant. A direct F-vs-d plot will be a curve — useful for visual comparison but not linear. To verify the inverse-square law, the standard trick is to plot F against **1/d** and against **1/d²** and look for which one is linear. The plot that lands on a straight line through the origin is the relationship that holds. (Comparing F-vs-1/d to F-vs-1/d² helps rule out a simple 1/d dependence — the two curves diverge.)

You'll generate all three plots in Part 2B and use the linear one to extract a second experimental value of k.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2B: Investigating Force and Distance',
    },
    {
      kind: 'instructions',
      tocLabel: 'Givens — Part 2B',
      // TEMP (2026-05-12): plain-markdown Givens block. See Part 2A note.
      html: `## Givens — Part 2B

Use these values throughout Part 2B:

| Symbol | Value | Role |
|---|---|---|
| $Q_1$ | $+2\\,\\mathrm{e}$ | constant (fixed across all measurements) |
| $Q_2$ | $+5\\,\\mathrm{e}$ | constant (fixed across all measurements) |
| $d$ | $200\\,\\mathrm{pm},\\ 300\\,\\mathrm{pm},\\ 400\\,\\mathrm{pm},\\ 500\\,\\mathrm{pm},\\ 600\\,\\mathrm{pm}$ | **vary** across your five measurements |

Stay on the **Atomic Scale** screen of the sim. Same unit reminders as Part 2A.`,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Confirm you're still on the **Atomic Scale** screen of the sim. Set $Q_1$ and $Q_2$ to the values given above, then transcribe them into the fields below. (You'll vary $d$ in the data table — no need to commit to a single $d$ here.)`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'constantChargeQ1Second', label: 'Constant charge Q₁', unit: 'e' },
        { id: 'constantChargeQ2', label: 'Constant charge Q₂', unit: 'e' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Step the distance $d$ through the five values given above (200 pm through 600 pm). Record the force $F$ shown by the sim at each value of $d$ (note its unit and stay consistent across rows). The $1/d$ and $1/d^2$ columns are computed automatically.`,
    },
    {
      kind: 'dataTable',
      tableId: 'forceDistanceTable',
      rowCount: 5,
      columns: [
        { id: 'distance', label: 'Distance d (pm)', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'inverseDistance',
          label: 'Inverse Distance (1/d)',
          formulaLabel: 'Inverse Distance (1/d)',
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
          label: 'Inverse Distance Squared (1/d²)',
          formulaLabel: 'Inverse Distance Squared (1/d²)',
          kind: 'derived',
          deps: ['distance'],
          precision: 4,
          formula: (row: NumericRow): number => {
            const d = row.distance ?? 0;
            return 1 / (d * d);
          },
        },
        { id: 'force', label: 'Force (F)', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Plot F vs d (for visual comparison only — expect a curve), F vs 1/d, and F vs 1/d². Add a proportional fit (y = Ax) to the **F vs 1/d²** plot.`,
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
      html: `**Procedure step 4.** Read off the slope A and its uncertainty ΔA (σₐ) from the F vs 1/d² proportional fit.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'forceDistanceSlopeA', label: 'A =' },
        { id: 'forceDistanceSlopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      fieldId: 'coulombsConstantCalculationSecond',
      prompt:
        "**Procedure step 5.** Use A to calculate your second experimental value of Coulomb's constant k. (Hint: with x = 1/d², the line equation is F = A·(1/d²) and Coulomb's law gives F = k|Q₁Q₂|/d². Setting them equal yields k|Q₁Q₂| = A.) **Important — unit conversion:** the slope A you read off the plot is in whatever units you used on each axis. Convert charges from e to coulombs (1 e ≈ 1.602 × 10⁻¹⁹ C), distances from pm to meters (1 pm = 10⁻¹² m), and force into N before extracting k. Show your work, then compute the percent error against the accepted k ≈ 8.988 × 10⁹ N·m²/C².",
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: `## Concept Check Questions

If you are not confident with your answer, stop and reach out for help before moving on!`,
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
        "Write your discussion & conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize your key findings from both parts of the lab, explain how your results confirm or refute the inverse-square framing of Coulomb's Law, draw parallels between Newton's Law of Gravitation and Coulomb's Law, discuss sources of uncertainty.)",
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
