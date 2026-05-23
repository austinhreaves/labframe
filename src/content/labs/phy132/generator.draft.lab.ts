// Split from phy132/magneticFieldFaraday.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Part 3 of the source draft
// (the generator parameter sweeps: 3A frequency, 3B coil-loop count, 3C
// coil area) and gives each sweep its own held-constants block, swept-
// variable data table, plot with proportional fit, slope-readout pair, and
// linearity CCQ. Parts 1 and 2 of the source live in the sibling lab
// phy132/faradayInduction.draft.lab.ts.
//
// Restructure decisions:
// - JIT theory delivery: a single combined Background block introduces the
//   generator EMF expression $\\mathcal{E}_{\\max} = N A \\omega B_{\\max}$
//   before Part 3A and identifies which factor each sub-part will vary.
//   This is cheaper on the student's working memory than three separate
//   theory blocks repeating the same formula, and it cross-references the
//   Faraday's-Law framing already introduced in the sibling lab.
// - Three <RecordTable> placeholders from the source draft (one per sub-
//   part, holding the constants for that sweep: the coil area + peak B +
//   loop count for 3A; the RPM + B + area for 3B; etc.) ported as
//   `multiMeasurement` blocks. Rationale: these are "Givens" lists (a few
//   labelled constants), not swept variables, so a multiMeasurement
//   captures their semantics better than a 1-row dataTable would. Each
//   row's value comes from the Set of Parameters reference noted in the
//   procedure body text. A `tocHidden: true` instructions block precedes
//   each multiMeasurement so the student knows to fill in constants from
//   the parameters sheet.
// - Four ⚠️ TODO(human) <MultiMeasurementField> instruction blocks in the
//   source (lines 321-322 and 471-475 of the source draft — the slope-
//   readout pairs for 3A and 3C) replaced with proper `multiMeasurement`
//   blocks of two rows (A, ΔA) matching the coulombsLaw pattern. Part 3B
//   was missing its slope-readout pair entirely in the source; added one
//   here for parity.
// - Three plots whose `sourceTableId: 'TODO_TABLE_ID'` in the source
//   pointed at no table fixed to point at `part3A_data`, `part3B_data`,
//   `part3C_data` respectively.
// - Source draft's `figure_3_X_description` concept placeholders (which had
//   prompt: "Figure 3-X: [Write a brief description]") replaced with
//   substantive prompts asking about the proportional-fit quality and the
//   linear dependence of EMF on the swept variable.
// - Source `discussionConclusion` had prompt: "TODO(human): missing prompt".
//   Replaced with a Part-3-scoped prompt covering the three sweeps and the
//   $\\mathcal{E}_{\\max} = N A \\omega B_{\\max}$ synthesis.
// - Em dashes stripped from HTML/preamble/prompt strings; paragraph breaks
//   added inside long HTML blocks per Mayer's spatial-contiguity principle.
// - Standalone "Concept Check Question(s)" divider blocks dropped.
// - "Set of Parameters" body-text references in the procedure are
//   intentionally LEFT IN PLACE pending the per-user-randomized-givens spec.
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance is a future per-concept-block feature.
import type { Lab } from '@/domain/schema';

export const phy132GeneratorLab: Lab = {
  id: 'generator',
  title: 'The Electric Generator',
  description:
    "Use the Generator screen of the Faraday's Electromagnetic Lab simulation to investigate how the peak induced EMF of a rotating-magnet generator depends on three variables: rotation frequency, number of coil loops, and coil area. Verify the linear scaling predicted by $\\mathcal{E}_{\\max} = N A \\omega B_{\\max}$ in each case.",
  category: 'Physics',
  simulations: {
    faradaysElectromagneticLab: {
      title: "Faraday's Electromagnetic Lab",
      url: 'https://sethmgibson.github.io/faradays-electromagnetic-lab/faradays-electromagnetic-lab.html',
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
      tocLabel: 'Background: Generator EMF',
      html: `## Background: Generator EMF

A simple AC generator is a coil that spins inside a steady magnetic field (or, equivalently, a magnet that spins inside a stationary coil, which is what this sim does). As the coil rotates, the angle $\\theta$ between $\\vec{B}$ and the coil's area vector $\\vec{A}$ changes with time as $\\theta = \\omega t$, and the flux through one turn is

$$\\Phi_B = B A \\cos(\\omega t).$$

Differentiating and multiplying by the number of turns $N$ gives the induced EMF:

$$\\mathcal{E}(t) = -N\\,\\frac{d\\Phi_B}{dt} = N A \\omega B \\sin(\\omega t).$$

The *peak* (maximum) EMF over one cycle is therefore

$$\\mathcal{E}_{\\max} = N A \\omega B_{\\max}\\tag{7}$$

where $\\omega = 2\\pi f$ is the angular frequency in rad/s and $f$ is the rotation frequency in Hz (or, equivalently, RPM/60).

Equation (7) predicts that $\\mathcal{E}_{\\max}$ is *linearly proportional* to each of $\\omega$, $N$, and $A$ when the other two are held constant. In Part 3 you'll test all three:

- **Part 3A** holds $A$, $B_{\\max}$, and $N$ constant and varies $\\omega$ (via RPM). A plot of $\\mathcal{E}_{\\max}$ vs RPM should be linear through the origin.
- **Part 3B** holds $\\omega$, $A$, and $B_{\\max}$ constant and varies $N$. A plot of $\\mathcal{E}_{\\max}$ vs number of loops should be linear through the origin.
- **Part 3C** holds $\\omega$, $N$, and $B_{\\max}$ constant and varies $A$. A plot of $\\mathcal{E}_{\\max}$ vs coil area should be linear through the origin.

In each case you'll add a proportional fit ($y = Ax$) and use the correlation coefficient $R$ to judge how well the data match Eq. (7).`,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Set up.** Switch to the *Generator* screen in the PhET sim and change the indicator to the voltmeter. Place the Field Indicator in the center of the coil.

Pull the blue hose knob to the right to release water; the magnet will begin rotating at some RPM. You can pause the simulation with the pause button and step through frame-by-frame to identify peak voltage and peak $B$-field values precisely.`,
    },
    {
      kind: 'instructions',
      html: '### Part 3A: Effect of Frequency (RPM)',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Keep the coil area, peak field strength $B_{\\max}$, and number of coil loops constant throughout Part 3A. Use the values listed in the Set of Parameters and record them below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3A_coilArea', label: 'Coil area A =' },
        { id: 'part3A_peakField', label: 'Peak field strength B_max =' },
        { id: 'part3A_coilLoops', label: 'Number of coil loops N =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 2.** Step the RPM through the values given in the Set of Parameters. For each RPM setting, pause the sim and step frame-by-frame to read the *peak* induced EMF. Record both columns in the table below.',
    },
    {
      kind: 'dataTable',
      tableId: 'part3A_data',
      rowCount: 5,
      columns: [
        { id: 'rpm', label: 'RPM', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'peakEMF_A', label: 'Peak EMF', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Plot peak EMF (y) vs. RPM (x) and add a proportional fit ($y = Ax$).',
    },
    {
      kind: 'plot',
      plotId: 'part3A_GraphContainer',
      sourceTableId: 'part3A_data',
      xCol: 'rpm',
      yCol: 'peakEMF_A',
      xLabel: 'RPM',
      yLabel: 'Peak EMF',
      title: 'Peak EMF vs. RPM',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Read off the slope $A$ and its uncertainty $\\Delta A$ from the proportional fit.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3A_slopeA', label: 'A =' },
        { id: 'part3A_slopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3A_figureDescription',
      prompt:
        'Describe the trend in peak EMF vs. RPM. Does the proportional fit pass through the data well? Report the correlation coefficient $R$ and comment on whether the relationship is linear.',
      rows: 3,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3A_linearityCCQ',
      prompt:
        'How well does the proportional ($y = Ax$) fit match the data? Comment on the correlation coefficient and what it tells you about the linearity between peak induced voltage and rotation frequency. Does this agree with the dependence on $\\omega$ predicted by Eq. (7)?',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: '### Part 3B: Effect of Number of Coil Loops',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Keep the RPM, coil area, and peak field strength $B_{\\max}$ constant throughout Part 3B. Use the values listed in the Set of Parameters and record them below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3B_rpm', label: 'RPM =' },
        { id: 'part3B_coilArea', label: 'Coil area A =' },
        { id: 'part3B_peakField', label: 'Peak field strength B_max =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Step the number of coil loops through the values given in the Set of Parameters and record each resultant peak EMF. The RPM will likely drift when you change the loop count; do your best to hold it constant. You can fine-tune RPM by pressing tab until the water knob is highlighted, then holding shift while pressing the arrow keys.`,
    },
    {
      kind: 'dataTable',
      tableId: 'part3B_data',
      rowCount: 4,
      columns: [
        {
          id: 'coilLoops',
          label: 'Number of Coil Loops N',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
        { id: 'peakEMF_B', label: 'Peak EMF', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Plot peak EMF (y) vs. number of coil loops (x) and add a proportional fit ($y = Ax$).',
    },
    {
      kind: 'plot',
      plotId: 'part3B_GraphContainer',
      sourceTableId: 'part3B_data',
      xCol: 'coilLoops',
      yCol: 'peakEMF_B',
      xLabel: 'Number of Coil Loops N',
      yLabel: 'Peak EMF',
      title: 'Peak EMF vs. Number of Coil Loops',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Read off the slope $A$ and its uncertainty $\\Delta A$ from the proportional fit.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3B_slopeA', label: 'A =' },
        { id: 'part3B_slopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3B_figureDescription',
      prompt:
        'Describe the trend in peak EMF vs. number of coil loops $N$. Does the proportional fit match the data? Report the correlation coefficient $R$ and comment on whether the relationship is linear.',
      rows: 3,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3B_linearityCCQ',
      prompt:
        'How well does the proportional ($y = Ax$) fit match the data? Comment on the correlation coefficient and what it tells you about the linearity between peak induced voltage and number of coil loops. Does this agree with the dependence on $N$ predicted by Eq. (7)?',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: '### Part 3C: Effect of Coil Area',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Keep the RPM, number of coil loops, and peak field strength $B_{\\max}$ constant throughout Part 3C. Use the values listed in the Set of Parameters and record them below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3C_rpm', label: 'RPM =' },
        { id: 'part3C_coilLoops', label: 'Number of coil loops N =' },
        { id: 'part3C_peakField', label: 'Peak field strength B_max =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2.** Step the coil area through the values given in the Set of Parameters (reported as a percentage in the sim) and record each resultant peak EMF. As in Part 3B, the RPM will likely drift when you change the coil area; do your best to hold it constant using the shift-arrow trick.`,
    },
    {
      kind: 'dataTable',
      tableId: 'part3C_data',
      rowCount: 9,
      columns: [
        {
          id: 'coilArea',
          label: 'Coil Area (percentage)',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
        { id: 'peakEMF_C', label: 'Peak EMF [V]', kind: 'input', unit: 'Symbol(unevaluable)' },
      ],
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Plot peak EMF (y) vs. coil area (x) and add a proportional fit ($y = Ax$).',
    },
    {
      kind: 'plot',
      plotId: 'part3C_GraphContainer',
      sourceTableId: 'part3C_data',
      xCol: 'coilArea',
      yCol: 'peakEMF_C',
      xLabel: 'Coil Area (%)',
      yLabel: 'Peak EMF [V]',
      title: 'Peak EMF vs. Coil Area',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Read off the slope $A$ and its uncertainty $\\Delta A$ from the proportional fit.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part3C_slopeA', label: 'A =' },
        { id: 'part3C_slopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3C_figureDescription',
      prompt:
        'Describe the trend in peak EMF vs. coil area $A$. Does the proportional fit match the data? Report the correlation coefficient $R$ and comment on whether the relationship is linear.',
      rows: 3,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'part3C_linearityCCQ',
      prompt:
        'How well does the proportional ($y = Ax$) fit match the data? Comment on the correlation coefficient and what it tells you about the linearity between peak induced voltage and coil area. Does this agree with the dependence on $A$ predicted by Eq. (7)?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'eq7Assumptions',
      prompt:
        'What assumptions underlie Eq. (7), $\\mathcal{E}_{\\max} = N A \\omega B_{\\max}$? (Hint: think about the geometry of the rotating coil relative to $\\vec{B}$, the uniformity of $\\vec{B}$ over the coil, and whether $B_{\\max}$ depends on $\\omega$.)',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'assumptionsAcrossSweeps',
      prompt:
        'Based on your data and graphs from Parts 3A, 3B, and 3C, how do those assumptions explain the linear (or near-linear) relationships you observed between peak induced voltage and each of frequency, number of coil loops, and coil area? Where in any of the three sweeps did you see deviations from perfect linearity, and which assumption was most likely to have been violated?',
      rows: 6,
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
        "Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how your three sweeps from Parts 3A, 3B, and 3C confirm or refute the linear dependence of $\\mathcal{E}_{\\max}$ on $\\omega$, $N$, and $A$ predicted by Eq. (7); compare the quality of the three proportional fits; note sources of uncertainty including RPM drift between trials.)",
      rows: 12,
      points: 4,
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
