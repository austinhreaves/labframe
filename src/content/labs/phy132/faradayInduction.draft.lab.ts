// Split from phy132/magneticFieldFaraday.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Part 1 (quantitative B vs d
// for a bar magnet, with 1/d^3 extraction and dipole-moment calculation)
// and Part 2 (qualitative observations of induced EMF from a moving magnet)
// from the source draft. Part 3 (generator parameter sweeps) is split into
// its own sibling lab, phy132/generator.draft.lab.ts.
//
// Restructure decisions:
// - JIT theory delivery: the bar-magnet far-field dipole law $B = (\mu_0/4\pi)(2m/r^3)$
//   surfaced before Part 1; the flux + Faraday-induction framing
//   $\Phi = B\cdot A$ and $\mathcal{E} = -d\Phi/dt$ surfaced before Part 2.
//   Source for both is the manual's Introduction section.
// - Procedure-step lead-ins consolidated into `concept.preamble` where the
//   following block is a concept; for measurement / multiMeasurement /
//   dataTable / image / plot blocks (which the schema does not give a
//   `preamble` field) the procedure step lives in a preceding
//   `instructions { tocHidden: true }` block, matching the coulombsLaw and
//   pointCharge conventions.
// - Source draft's auto-emitted `figure_X_X_description` concept placeholders
//   (which had prompt: "Graph X-X: [Write a brief description]") replaced
//   with substantive description prompts anchored to what each graph is
//   showing (trend, near-field vs far-field, linearity quality).
// - Source `discussionConclusion` had prompt: "TODO(human): missing prompt".
//   Replaced with a Parts-1+2-scoped prompt (dipole confirmation, near/far
//   field discussion, qualitative EMF observations, sources of uncertainty).
// - Derived column `inverseDistanceCubed` legacy formula was a stringified
//   `(1 / Math.pow(distance, 3)).toFixed(8)` — ported to a numeric
//   `formula: (row) => row.distance ? 1 / Math.pow(row.distance, 3) : 0`
//   with precision: 8 and a zero-guard so a missing/zero distance returns 0
//   instead of Infinity.
// - Em dashes stripped from HTML/preamble/prompt strings; paragraph breaks
//   added inside long HTML blocks per Mayer's spatial-contiguity principle.
// - Standalone "Concept Check Question(s)" divider blocks dropped; the
//   concept blocks they preceded stand on their own.
// - "Set of Parameters" body-text references in the procedure are
//   intentionally LEFT IN PLACE. The interim Givens-markdown migration is
//   superseded by the per-user-randomized-givens spec; body-text references
//   will be replaced by structured givens at that point.
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance is a future per-concept-block feature.
import type { Lab, NumericRow } from '@/domain/schema';

export const phy132FaradayInductionLab: Lab = {
  id: 'faradayInduction',
  title: 'Magnetic Field & Faraday Induction',
  description:
    "Use the Faraday's Electromagnetic Lab simulation to measure how a bar magnet's field falls off with distance, extract the magnetic dipole moment from a proportional fit to B vs 1/d^3, and observe how induced EMF in a pickup coil depends on magnet speed, coil-turn count, and coil area.",
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
      tocLabel: 'Background: The Far-Field Bar-Magnet Dipole',
      pdfHidden: true,
      html: `## Background: The Far-Field Bar-Magnet Dipole

A bar magnet has a north pole and a south pole separated by a small distance. At distances much larger than the magnet's length (the *far-field* regime), the magnetic field along the magnet's axis falls off as the inverse cube of the distance:

$$B = \\frac{\\mu_0}{4\\pi}\\,\\frac{2m}{r^{3}}\\tag{2}$$

where $m$ is the *magnetic dipole moment* of the magnet (units of $\\mathrm{A}\\cdot\\mathrm{m}^{2}$) and $\\mu_0 = 4\\pi \\times 10^{-7}\\,\\mathrm{T}\\cdot\\mathrm{m/A}$ is the permeability of free space.

Equation (2) is a *dipole approximation*. It treats the magnet as a single point dipole and is only accurate far from the magnet's body. Up close (the *near-field* regime), the finite size of the magnet matters, the field is no longer simply $1/r^{3}$, and the field inside the magnet is essentially constant.

To test equation (2) and extract a value for $m$, the standard trick is to plot $B$ against $1/d^{3}$ and look for a straight line in the far-field portion of the data. If the dipole approximation holds, the slope of the linear (proportional) fit equals $\\mu_0 m / (2\\pi)$, which you can solve for $m$.

In Part 1 you'll measure $B(d)$ at 12 distances using the PhET *Faraday's Electromagnetic Lab* sim, plot both $B$-vs-$d$ and $B$-vs-$1/d^{3}$, restrict the proportional fit to the far-field points, and use the slope to compute $m$.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1: Bar-Magnet Field Strength vs. Distance',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Bar Magnet* screen in the PhET *Faraday's Electromagnetic Lab* simulation. Enable the **Field Meter** and set the Bar Magnet Strength to the value given in the Set of Parameters. Record the strength value below.

**Procedure step 2.** Drag the bar magnet as far left as possible so its center aligns with the 0 cm vertical grid line, and align the magnet horizontally along any horizontal grid line.`,
    },
    {
      kind: 'measurement',
      fieldId: 'barMagnetStrength',
      label: 'Bar Magnet Strength',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 3.** Place the field meter at distances of 10 cm, 20 cm, ..., 120 cm from the center of the bar magnet along the same horizontal grid line. For the first few distances (10 cm, 20 cm), the meter is still inside or right against the magnet body, so the reading reflects the near-field; that's expected.

**Procedure step 4.** Record the magnetic field strength at each distance in the table below. The $1/d^{3}$ column is computed automatically.`,
    },
    {
      kind: 'dataTable',
      tableId: 'magneticFieldTable',
      rowCount: 12,
      columns: [
        { id: 'distance', label: 'Distance d (cm)', kind: 'input' },
        {
          id: 'inverseDistanceCubed',
          label: '1/d^3',
          formulaLabel: '1/d^3',
          kind: 'derived',
          deps: ['distance'],
          precision: 8,
          formula: (row: NumericRow): number => {
            const d = row.distance ?? 0;
            return d === 0 ? 0 : 1 / Math.pow(d, 3);
          },
        },
        {
          id: 'fieldStrength',
          label: 'Field Strength B',
          kind: 'input',
        },
      ],
      points: 2,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 5.** A graph of field strength $B$ (y-axis) vs. distance $d$ (x-axis) is generated below.',
    },
    {
      kind: 'plot',
      plotId: 'fieldStrengthVsDistanceGraphContainer',
      sourceTableId: 'magneticFieldTable',
      xCol: 'distance',
      yCol: 'fieldStrength',
      xLabel: 'd (cm)',
      yLabel: 'B',
      title: 'Field Strength vs. Distance',
    },
    {
      kind: 'concept',
      fieldId: 'figureBvsD_description',
      prompt:
        'Describe the trend in $B$ vs. $d$. Is the plot linear? Where (in $d$) does the curve fall off most steeply, and where does it flatten? What does this shape tell you about how the bar-magnet field changes with distance?',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 6.** A second graph of $B$ vs. $1/d^{3}$ is generated below using the derived column.',
    },
    {
      kind: 'plot',
      plotId: 'fieldStrengthVsInverseDistanceCubedGraphContainer',
      sourceTableId: 'magneticFieldTable',
      xCol: 'inverseDistanceCubed',
      yCol: 'fieldStrength',
      xLabel: '1/d^3 (1/cm^3)',
      yLabel: 'B',
      title: 'Field Strength vs. 1/d^3',
    },
    {
      kind: 'concept',
      fieldId: 'figureBvsInverseDistanceCubed_description',
      prompt:
        'Describe the trend in $B$ vs. $1/d^{3}$. Which part of the plot looks linear, and which part bends away from the line? Recall that larger $1/d^{3}$ means *closer* to the magnet (smaller $d$) and smaller $1/d^{3}$ means *farther* from the magnet.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'nearVsFarFieldAnalysis',
      prompt: `Look closely at the pattern of data points in the $B$ vs. $1/d^{3}$ graph and answer the following questions:

(a) In which region of the graph does the slope between several consecutive data points remain nearly constant, indicating a linear relationship?

(b) Where do you notice a deviation from a linear relationship?

(c) Is the data linear in the *near-field* or *far-field* region? Hint: on your $B$ vs. $1/d^{3}$ graph, moving to the right on the x-axis corresponds to increasing $1/d^{3}$, which means moving *closer* to the magnet. Moving left on the x-axis corresponds to decreasing $1/d^{3}$, or moving *farther* from the magnet.`,
      rows: 8,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 7.** Theory tells us a bar magnet's field can be modeled as a simple dipole in the *far-field* region. Using only the data points in the far-field region, apply a proportional ($y = Ax$) fit to the $B$-vs-$1/d^{3}$ graph below.

Sanity check: the correlation coefficient $R$ should be greater than 0.98. If it isn't, you've included too many near-field points in the fit.`,
    },
    {
      kind: 'plot',
      plotId: 'fieldStrengthVsInverseDistanceCubedFittedGraphContainer',
      sourceTableId: 'magneticFieldTable',
      xCol: 'inverseDistanceCubed',
      yCol: 'fieldStrength',
      xLabel: '1/d^3 (1/cm^3)',
      yLabel: 'B',
      title: 'Field Strength vs. 1/d^3 (Far-Field Fit)',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'figureBvsInverseDistanceCubedFitted_description',
      prompt:
        'Describe the proportional fit you obtained. Which range of $1/d^{3}$ values did you include in the fit, and why did you stop there? Report the correlation coefficient $R$ and comment on the quality of the fit.',
      rows: 4,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 8.** Read the slope $A$ and its uncertainty $\\Delta A$ from the proportional fit.',
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'dipoleFitSlopeA', label: 'A =' },
        { id: 'dipoleFitSlopeUncertainty', label: 'ΔA =' },
      ],
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'dipoleMomentCalculation',
      prompt:
        '**Procedure step 9.** Using Eq. (2) above and your fitted slope $A$, calculate the magnetic dipole moment $m$ of the bar magnet in units of $\\mathrm{A}\\cdot\\mathrm{m}^{2}$. Hint: match the terms in the $y = Ax$ model with the terms in Eq. (2). The independent variable is $1/d^{3}$ and the dependent variable is $B$; what is left over equals the slope $A$. Be careful with units: convert distances from cm to m before extracting $m$. Show all your work.',
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'magnetTypeFromDipole',
      prompt:
        'Based on your calculated value of the magnetic dipole moment, what type of magnet did the simulation give you (e.g., refrigerator magnet, neodymium magnet, lab solenoid, etc.)? Compare your value to typical published dipole moments to justify your answer.',
      rows: 3,
      points: 0.67,
    },
    {
      kind: 'concept',
      fieldId: 'dipoleEquationAssumption',
      prompt:
        'What physical assumption underlies Eq. (2), $B = (\\mu_0/4\\pi)(2m/r^{3})$? Under what circumstances does this approximation break down?',
      rows: 4,
      points: 0.67,
    },
    {
      kind: 'concept',
      fieldId: 'engineeringApplicationsNearField',
      prompt:
        'How might an engineer designing electric motors, transformers, magnetic sensors, wireless power transfer systems, or electromagnetic shielding need to predict the behavior of magnetic fields in *near-field* interactions? Why does the dipole approximation alone not suffice in those settings?',
      rows: 5,
      points: 0.67,
    },
    {
      kind: 'instructions',
      tocLabel: "Background: Magnetic Flux and Faraday's Law",
      pdfHidden: true,
      html: `## Background: Magnetic Flux and Faraday's Law

The *magnetic flux* through a flat loop of area $A$ in a uniform magnetic field $\\vec{B}$ is

$$\\Phi_B = \\vec{B} \\cdot \\vec{A} = B A \\cos\\theta$$

where $\\theta$ is the angle between $\\vec{B}$ and the normal to the loop. Flux has units of $\\mathrm{T}\\cdot\\mathrm{m}^{2}$, also called the *weber* (Wb).

Faraday's Law of induction says that when the magnetic flux through a loop *changes in time*, an EMF $\\mathcal{E}$ is induced around the loop equal to the negative time-rate-of-change of the flux:

$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$

If the loop has $N$ turns, each turn contributes the same flux change, so the total induced EMF is

$$\\mathcal{E} = -N\\,\\frac{d\\Phi_B}{dt}$$

Three knobs change $\\Phi_B$ (or scale the EMF response): the field strength $B$ at the loop, the loop area $A$, and the number of turns $N$. Anything that changes one of these in time induces an EMF. In Part 2 you'll qualitatively observe how each of these knobs affects the induced EMF when you push a bar magnet through a pickup coil. In the companion *Electric Generator* lab, you'll then make quantitative measurements of how $\\mathcal{E}_{\\max}$ scales with each.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2: Qualitative Observations of Induced EMF',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Set up.** Switch to the *Pickup Coil* screen in the PhET sim. Enable **Lock to Axis** to keep the magnet aligned with the center of the coil. Switch the indicator from the light-bulb icon to the *voltmeter* icon. Place a bar magnet near the coil so you can observe the voltmeter as you move the magnet.

**Procedure step 1 (speed).** Move the bar magnet through the coil and observe the voltmeter reading. Watch the needle of the EMF reading when you move the magnet *slowly* and then *quickly* through the coil. Then repeat in the opposite direction. Note the polarity (positive or negative EMF) and the magnitude in each case.`,
    },
    {
      kind: 'concept',
      fieldId: 'speedObservation',
      prompt:
        'How does the *speed* at which the magnet is moved through the coil affect the magnitude of the induced EMF? How does the *direction* of motion affect the polarity? Explain your observations in terms of $d\\Phi_B/dt$.',
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 2 (turns).** Adjust the number of turns in the pickup coil. Set the coil to 1, 2, 3, and 4 turns in succession, and move the bar magnet through the coil at roughly the same speed each time. (Tip: tab to the magnet, then use the arrow keys, holding shift to slow the motion, so your speed is reproducible.) Watch the EMF magnitude for each setting.`,
    },
    {
      kind: 'concept',
      fieldId: 'turnsObservation',
      prompt:
        "How does *increasing the number of turns* in the coil affect the induced EMF, holding everything else constant? Explain your observation in terms of Faraday's Law for a multi-turn coil: $\\mathcal{E} = -N\\,d\\Phi_B/dt$.",
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3 (area).** Use the control in the PhET simulation to increase the *coil area* while keeping the number of turns constant. Move the bar magnet through the coil at roughly the same speed and observe how the induced EMF changes.',
    },
    {
      kind: 'concept',
      fieldId: 'areaObservation',
      prompt:
        'How does *increasing the coil area* affect the induced EMF, holding the number of turns and the magnet speed constant? Explain your observation in terms of how $A$ enters the flux $\\Phi_B = B A \\cos\\theta$.',
      rows: 5,
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
        'Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how your Part 1 data confirm or refute the $1/d^{3}$ scaling of $B$ in the far-field region; report your extracted dipole moment $m$ and what it implies about the magnet; describe your Part 2 qualitative observations of how speed, turn count, and coil area each affect induced EMF; note sources of uncertainty in both parts.)',
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
