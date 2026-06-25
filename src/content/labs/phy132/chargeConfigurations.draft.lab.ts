// Split from phy132/chargesFields.draft.lab.ts on 2026-05-23 per
// docs/handoffs/split-labs-3-7-handoff.md. Takes Parts 2A (dipole) and 2B
// (parallel stacked dipoles) — the qualitative half of the source draft.
//
// Restructure decisions:
// - JIT theory delivery: superposition + electric dipoles surfaced before
//   Part 2A; uniform-field framing (lead-in to parallel-plate capacitors)
//   surfaced before Part 2B. Manual Introduction is the source for both.
// - Procedure-step lead-ins consolidated into `concept.preamble` where the
//   following block is a concept; image blocks use a preceding
//   `instructions { tocHidden: true }` block (the schema does not give
//   image blocks a preamble field).
// - Standalone "Concept Check Questions" divider boxes dropped (chargeBuildup
//   convention).
// - Duplicate prompt on discussionConclusion de-duplicated.
// - Em dashes stripped from HTML/preamble strings; paragraph breaks added.
// - "Set of Parameters" references in the body text are intentionally LEFT IN
//   PLACE. The interim Givens-markdown migration from the handoff is
//   superseded by the per-user-randomized-givens spec (see
//   docs/specs/per-user-randomized-givens.md). Do not inline parameter
//   values here.
// - TODO(ai-coaching): future home of "Not confident in your answer?"
//   Socratic-prompt affordance at the concept-block level.
import type { Lab } from '@/domain/schema';

export const phy132ChargeConfigurationsLab: Lab = {
  id: 'chargeConfigurations',
  title: 'Charge Configurations',
  description:
    'Use the PhET Charges and Fields simulation to map electric field and equipotential lines for an electric dipole and for parallel stacked dipoles, and reason qualitatively about field uniformity.',
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
      pdfHidden: true,
      tocLabel: 'Background: Superposition and Electric Dipoles',
      html: `## Background: Superposition and Electric Dipoles

When more than one charge is present, the total electric field at any point is the *vector sum* of the fields produced by each charge individually. This is the **superposition principle**.

A simple but rich example is the **electric dipole**: one positive and one negative charge of equal magnitude held a fixed distance apart. The fields and equipotentials around a dipole encode two questions you'll be asked to think about:

1. Where in space does the field point in a clean, predictable direction (e.g., from + to -)?
2. Where in space is the field *not* uniform, and why?

Equipotential lines (surfaces of constant $V$) are always perpendicular to electric-field lines: this is a direct consequence of equation (6) from the previous lab combined with $\\vec{E} = -\\nabla V$. Where the equipotential rings are closely spaced, $V$ changes rapidly with distance and the field is strong; where they're far apart, the field is weak.

In Part 2A you'll observe a single dipole. In Part 2B you'll stack several dipoles in parallel and observe how the field in the central region becomes much more uniform. This is the conceptual lead-in to the next lab on capacitors.`,
    },
    {
      kind: 'instructions',
      html: '### Part 2A: Field and Equipotentials of a Dipole',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Open the *Charges and Fields* sim. Check the **Grid** and **Values** boxes. Place two charges of equal magnitude and opposite sign according to the Set of Parameters. Enable the **Electric Field** view to display the field vectors.

**Procedure step 2.** Use the equipotential tool to draw the equipotential rings called for in the Set of Parameters. Observe the orientation of the field vectors relative to the equipotential lines: they should be everywhere perpendicular.

**Procedure step 3.** Take a screenshot of the completed field-and-equipotential map and attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part2AImage',
      captionFieldId: 'part2ACaption',
      maxMB: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'dipoleEquipotentialSpacingQuestion',
      prompt:
        'Are the equipotential surfaces equally separated in the central region between the two charges?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'dipoleFieldUniformityQuestion',
      prompt:
        'Is the electric field uniform in the central region between the two charges? What makes it uniform or non-uniform?',
      points: 1,
    },
    {
      kind: 'instructions',
      pdfHidden: true,
      tocLabel: 'Background: What Makes a Field Uniform?',
      html: `## Background: What Makes a Field Uniform?

A vector field is **uniform** in a region if the vectors at every point in that region have the same magnitude *and* the same direction. Visually, a uniform field looks like a regular grid of identical arrows.

For a single dipole, the central region between the two charges has field vectors that point roughly the same direction, but the magnitude varies (the field is stronger near each charge and weaker in the middle). It's close to uniform but not quite.

In Part 2B you'll stack three or more dipoles in parallel. The geometry is the seed of the **parallel-plate capacitor**: by spreading charge along two surfaces instead of concentrating it at two points, you flatten the field in the middle. The closer the spacing on each plate, the more uniform the central field becomes.

Watch for two effects: (a) how the equipotential ring spacing in the central region changes between the single-dipole and stacked-dipole cases; (b) where the field becomes uniform and where it remains non-uniform (the "fringing field" at the edges).`,
    },
    {
      kind: 'instructions',
      html: '### Part 2B: Field and Equipotentials of Parallel Stacked Dipoles',
    },
    {
      kind: 'instructions',
      tocHidden: true,
      html: `**Procedure step 1.** Clear the screen. Set up parallel stacked dipoles according to the Set of Parameters: place several positive charges along a vertical line on the left and the same number of negative charges along a parallel vertical line on the right, evenly spaced.

**Procedure step 2.** Enable the **Electric Field** view. Use the equipotential tool to draw equipotential rings throughout the region between and around the stacked dipoles.

**Procedure step 3.** Take a screenshot of the completed field-and-equipotential map and attach it below.`,
    },
    {
      kind: 'image',
      imageId: 'part2BImage',
      captionFieldId: 'part2BCaption',
      maxMB: 5,
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'stackedEquipotentialSpacingQuestion',
      prompt:
        'Are the equipotential surfaces equally separated in the central region between the two lines of charge? (At minimum: is the spacing more uniform than in the single-dipole case?)',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'stackedFieldUniformityQuestion',
      prompt:
        'Is the electric field uniform in the central region between the two lines of charge? What makes it uniform or non-uniform? (At minimum: is the field more uniform than in the single-dipole case?)',
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'whichGeometryMoreUniformQuestion',
      prompt:
        'Which charge geometry generates a more uniform electric field in its central region? Explain your answer in terms of how the charge is distributed and how that distribution shapes the equipotentials and field lines. Remember to consider causality: what causes what?',
      rows: 5,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'energyStorageDeviceQuestion',
      prompt:
        'If you needed to design a device that stores a large amount of energy in its electric field, would it be more effective to use two point charges, or two parallel lines (or sheets) of charge? Why?',
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
        'Write your discussion and conclusion below according to the guidelines given in the Lab Report Rubric, found in the Course Information module on Canvas. Summarize what your dipole and parallel-stacked-dipole maps show about how charge distribution shapes the resulting field, and connect those observations to the design intuition behind a parallel-plate capacitor.',
      rows: 12,
      points: 5,
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
