// PHY 114 variant of the PHY 132 Point Charge lab.
//
// Derived from phy132/pointCharge.draft.lab.ts. PHY 114 is algebra-based and
// does NOT cover experimental uncertainty or error propagation, so this copy
// removes the 132 version's uncertainty content:
//   - the "and its uncertainty" slope-reading clause in Part 1B step 5,
//   - the sigma_m uncertainty row in the slope multiMeasurement block,
//   - the slopeErrorCalculation block (propagating sigma_m into k*q),
//   - the "sources of uncertainty" clause in the conclusion prompt.
// The k*q percent-error-vs-expected comparison is algebra-appropriate and KEPT.
//
// If the 132 source changes, re-sync this copy by hand (the two are
// intentionally independent files, one per course).
import type { Lab, NumericRow } from '@/domain/schema';

export const phy114PointChargeLab: Lab = {
  id: 'pointCharge',
  title: 'Electric Field & Potential of a Point Charge',
  description:
    'Use the PhET Charges and Fields simulation to measure the electric field and electric potential around a single point charge, and extract a value for k·q from the slope of V vs. 1/r.',
  category: 'Physics',
  simulations: {
    chargesAndFields: {
      title: 'Charges and Fields',
      url: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_en.html',
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
      tocLabel: "Background: Coulomb's Law and the Electric Field",
      html: `## Background: Coulomb's Law and the Electric Field

A charged particle produces an *electric field* in the space around it. The field at a point in space is defined as the electric force exerted on an infinitesimally small positive test charge placed at that point:

$$\\vec{E} = \\frac{\\vec{F}}{q_{\\text{test}}}$$

The SI unit of $E$ is the newton per coulomb (N/C), equivalent to the volt per meter (V/m).

For an isolated point charge $q$, Coulomb's Law gives the force between $q$ and a small test charge $q_{\\text{test}}$ at distance $r$:

$$F = k\\,\\frac{|q\\,q_{\\text{test}}|}{r^{2}}, \\qquad k \\approx 8.988 \\times 10^{9}\\,\\mathrm{N\\,m^{2}/C^{2}}$$

Dividing by $q_{\\text{test}}$ gives the magnitude of the electric field due to the point charge:

$$E = k\\,\\frac{|q|}{r^{2}}\\tag{3}$$

The field is directed radially outward from positive charges and radially inward toward negative charges. Its magnitude falls off as the inverse square of the distance from the source.

In Part 1A you'll verify equation (3) three ways: (a) by measuring $E$ at four equidistant sensor positions and comparing the average to a direct calculation; (b) by doubling $q$ at fixed $r$ and predicting how $E$ changes; (c) by doubling $r$ at fixed $q$ and predicting how $E$ changes.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1A(a): Field of a Single Point Charge',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Charges and Fields* sim. Check the **Grid** and **Values** boxes. Place a point charge of magnitude $q$ (see Set of Parameters) at the center of the screen by dragging it onto a grid intersection. Arrange four electric-field sensors at equal distance $r$ (see Set of Parameters) from the charge in the +x, -x, +y, and -y directions. Use the measuring tape to confirm each sensor's distance.

Record the values of $q$ and $r$ you used below. These same values will be used throughout Part 1A.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'chargeValue', label: 'Charge q =' },
        { id: 'distanceValue', label: 'Sensor distance r =' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 2.** Take a screenshot showing the charge and all four sensors with their field-strength readings visible. Attach it below with a brief caption.',
    },
    {
      kind: 'image',
      imageId: 'part1aImage',
      captionFieldId: 'part1aCaption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Record the measured magnitude of $E$ at each of the four sensor positions, then use equation (3) and your $q$ and $r$ values to calculate the predicted magnitude. Enter both values in the table below.',
    },
    {
      kind: 'dataTable',
      tableId: 'fieldDirectionTable',
      rowCount: 4,
      columns: [
        { id: 'direction', label: 'Sensor position', kind: 'input', unit: 'Symbol(unevaluable)' },
        { id: 'measuredField', label: 'Measured E', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'calculatedField',
          label: 'Calculated E',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
      ],
      points: 1.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'sampleCalculation',
      prompt:
        'Show a sample calculation of $E = k|q|/r^{2}$ for one of your four sensor positions. Use the $q$ and $r$ values you recorded above.',
      equationEditor: true,
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'percentErrorCalculation',
      prompt:
        'Compute the average of your four *measured* field values and the average of your four *calculated* field values. Use these to compute a percent error between the measured and calculated averages.',
      equationEditor: true,
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'qualitativeObservations',
      prompt:
        'Explain your observations qualitatively. What happens to the magnitude of the electric field as you move the sensors closer to or farther from the charge? What about the direction of the field at the four sensor positions? Is there any pattern or symmetry?',
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '### Part 1A(b): Doubling the Charge at Constant Distance',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Clear the screen. Place a single point charge $q$ on the grid and put one electric-field sensor at distance $r$ from it. Record the field strength.

**Procedure step 2.** Keeping the sensor in the same position, add additional point charges on top of the first so the total charge at that location is now $2q$. Record the new field strength.

Record the (held-constant) distance $r$ here, then enter the two measurements in the table below.`,
    },
    {
      kind: 'measurement',
      fieldId: 'constantDistanceValue',
      label: 'Sensor distance r =',
    },
    {
      kind: 'dataTable',
      tableId: 'fieldVsChargeTable',
      rowCount: 2,
      columns: [
        { id: 'charge', label: 'Charge', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'fieldStrength',
          label: 'Field strength E',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
      ],
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'chargeDoublingObservations',
      prompt:
        'Explain your observations qualitatively and quantitatively. How did the measured $E$ change when you doubled $q$? Does this agree with the prediction of equation (3)?',
      rows: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: '### Part 1A(c): Doubling the Distance at Constant Charge',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Clear the screen. Place a single point charge $q$ on the grid and put one sensor at distance $r$. Record the field strength.

**Procedure step 2.** Without changing the charge, move the sensor (or place a second sensor) at distance $2r$. Record the new field strength.

Record the (held-constant) charge $q$ here, then enter the two measurements in the table below.`,
    },
    {
      kind: 'measurement',
      fieldId: 'constantChargeValue',
      label: 'Charge q =',
    },
    {
      kind: 'dataTable',
      tableId: 'fieldVsDistanceTable',
      rowCount: 2,
      columns: [
        { id: 'distance', label: 'Distance', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'fieldStrength',
          label: 'Field strength E',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
      ],
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'distanceDoublingObservations',
      prompt:
        'Explain your observations qualitatively and quantitatively. How did the measured $E$ change when you doubled $r$? Does this agree with the prediction of equation (3)?',
      rows: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Electric Potential of a Point Charge',
      html: `## Background: Electric Potential of a Point Charge

The *electric potential* $V$ at a point in space is the electric potential energy per unit charge that a small test charge would have at that location. Its unit is the volt (V), equivalent to a joule per coulomb (J/C).

For a single point charge $q$, integrating $\\vec{E}\\cdot d\\vec{r}$ from infinity inward (taking $V \\to 0$ as $r \\to \\infty$) gives:

$$V(r) = \\frac{k\\,q}{r}\\tag{6}$$

This is *not* an inverse-square relationship: it falls off as $1/r$, not $1/r^{2}$. Direct $V$-vs-$r$ data will be a curve.

To verify equation (6) and extract a value of $k\\,q$ experimentally, the standard trick is to plot $V$ against $1/r$ and look for a straight line. If the relationship is correct, the slope of the linear fit equals $k\\,q$.

In Part 1B you'll measure $V$ at five equipotential rings around a single point charge, generate both $V$-vs-$r$ and $V$-vs-$1/r$ plots, and use the linear plot's slope to compute $k\\,q$. You'll then compare this experimental value against $k\\,q$ computed directly from the known $q$ and Coulomb's constant.`,
    },
    {
      kind: 'instructions',
      html: '### Part 1B: Mapping the Electric Potential',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Clear the screen. Check the **Grid** and **Values** boxes. Place a single point charge $q$ (see Set of Parameters) at the center of the screen, and record the charge value below.

**Procedure step 2.** Click the equipotential tool (the meter with crosshairs). Move it to a point 0.5 m from the charge and click the pencil icon to draw the equipotential ring through that point. Repeat at 1.0, 1.5, 2.0, and 2.5 m. Record the potential value displayed by the meter for each ring in the data table.`,
    },
    {
      kind: 'measurement',
      fieldId: 'part1BChargeValue',
      label: 'Charge q =',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 3.** Take a screenshot of your completed equipotential map and attach it below.',
    },
    {
      kind: 'image',
      imageId: 'part1BImage',
      captionFieldId: 'part1BCaption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 4.** Record the distance and measured potential for each of your five equipotential rings. The $1/r$ column is computed automatically.',
    },
    {
      kind: 'dataTable',
      tableId: 'potentialDistanceTable',
      rowCount: 5,
      columns: [
        { id: 'distance', label: 'Distance r (m)', kind: 'input', unit: 'Symbol(unevaluable)' },
        {
          id: 'inverseDistance',
          label: 'Inverse Distance (1/r)',
          formulaLabel: 'Inverse Distance (1/r)',
          kind: 'derived',
          deps: ['distance'],
          precision: 4,
          formula: (row: NumericRow): number => {
            const r = row.distance ?? 0;
            return r === 0 ? 0 : 1 / r;
          },
        },
        {
          id: 'potential',
          label: 'Electric Potential V',
          kind: 'input',
          unit: 'Symbol(unevaluable)',
        },
      ],
      points: 2,
    },
    {
      kind: 'plot',
      plotId: 'potentialVsDistanceGraphContainer',
      sourceTableId: 'potentialDistanceTable',
      xCol: 'distance',
      yCol: 'potential',
      xLabel: 'r (m)',
      yLabel: 'V',
      title: 'Potential vs. Distance',
    },
    {
      kind: 'concept',
      fieldId: 'potentialDistanceResponse',
      prompt:
        'How does the electric potential vary with distance from the source charge? Is the $V$-vs-$r$ plot linear? How do you know?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'plot',
      plotId: 'potentialVsInverseDistanceGraphContainer',
      sourceTableId: 'potentialDistanceTable',
      xCol: 'inverseDistance',
      yCol: 'potential',
      xLabel: '1/r (1/m)',
      yLabel: 'V',
      title: 'Potential vs. 1/r',
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
      points: 0.5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: '**Procedure step 5.** Read the slope from the proportional fit on the $V$-vs-$1/r$ plot.',
    },
    {
      kind: 'measurement',
      fieldId: 'slopeValue',
      label: 'Slope m =',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'inverseDistanceResponse',
      prompt:
        'Is the $V$-vs-$1/r$ plot linear? How do you know? What does this tell you about the functional form of $V(r)$ for a single point charge?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'kqCalculation',
      prompt:
        'Equation (6) predicts $V = (kq) \\cdot (1/r)$, so a $V$-vs-$1/r$ plot should be linear with slope $kq$. Use the known value of $q$ and $k \\approx 8.988 \\times 10^{9}\\,\\mathrm{N\\,m^{2}/C^{2}}$ to compute the *expected* slope $kq$. Then compare it to the slope $m$ you read off the plot by computing a percent error.',
      equationEditor: true,
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
        'Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. (e.g., summarize how your data from Part 1A confirm or refute the $1/r^{2}$ scaling of $E$; how your data from Part 1B confirm or refute the $1/r$ scaling of $V$; how well your experimental $kq$ agrees with the expected value.)',
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
