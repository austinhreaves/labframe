// Restructured 2026-05-11 per Austin's content fixes:
// - Segmenting principle preserved, but procedural steps now live in the
//   `preamble` field of the concept block they belong to (one box per
//   procedure + observation pair instead of two).
// - JIT theory delivery: charging mechanisms surfaced before Part 1A;
//   conservation of charge surfaced before Part 1B; polarization vs.
//   induction surfaced before Part 1C.
// - New field balloonSweaterObservation added per content review.
// - Concept-check question prompts retained in full (synthesis, not observation).
// 2026-05-12 additions:
// - Part 1C added (conduction + induction in the OSP two-conductor sim).
// - Box count reduced by folding procedure-step text into concept-block
//   preambles; standalone "Concept Check" divider boxes removed.
// - Em dashes stripped; paragraph segmenting added inside HTML blocks.
// - TODO(ai-coaching): the "Not confident in your answer?" Socratic-prompt
//   affordance now lives at the concept-block level rather than as a
//   separate divider. See conversation 2026-05-11 for design notes.
import type { Lab } from '@/domain/schema';

export const phy132ChargeBuildupLab: Lab = {
  id: 'chargeBuildup',
  title: 'Charge Buildup',
  description:
    'Explore static electricity phenomena through interactive PhET simulations. Investigate how charge accumulates and discharges in everyday situations.',
  category: 'Physics',
  simulations: {
    johnTravoltage: {
      title: 'John Travoltage',
      url: 'https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_all.html',
      allow: 'fullscreen',
    },
    balloons: {
      title: 'Balloons and Static Electricity',
      url: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_all.html',
      allow: 'fullscreen',
    },
    twoConductorInduction: {
      title: 'Two-Conductor Induction (Physics Lens / OSP)',
      url: 'https://physicstjc.github.io/ophysics/static-electricity/charging-by-induction-two-conductors.html',
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
      pdfHidden: true,
      tocLabel: 'Background: Charge Imbalance',
      html: `## Background: How Charge Imbalances Form

Atoms prefer to be electrically neutral: equal numbers of protons and electrons. A net charge on an object means an imbalance.

There are three common mechanisms that produce such an imbalance.

---

**1. Charging by friction (triboelectric).** When two materials with different electron affinities rub together, friction transfers electrons from the electron donor (low electronegativity) to the electron acceptor (high electronegativity). The two surfaces end up with charges of opposite signs.

The *triboelectric series* ranks common materials by this tendency: wool, hair, and human skin sit high (lose electrons easily); rubber, vinyl, and Teflon sit low (gain them).

---

**2. Charging by conduction.** When a charged object physically contacts a conductor, charge flows between them. Both end up with a charge of the **same sign** as the originally charged object.

Conduction can also happen through a brief conductive path. A spark, for example, momentarily ionizes the air into a conductor.

---

**3. Charging by induction.** A charged object brought *near* (without contact) a neutral conductor rearranges the conductor's free electrons.

If the conductor is split apart, or grounded and then disconnected, *while the inducing object is still nearby*, the rearranged charges become trapped. The conductor then retains a net charge **opposite** to the inducing object even after the inducing object is removed.

---

> [!NOTE]
> An *insulator* near a charged object experiences a charge rearrangement too, but only within each molecule; electrons can't migrate across the surface. That's called **polarization**. It produces an attractive force just like induction does, but leaves no lasting net charge behind. You'll see both phenomena in the simulations below.`,
    },
    {
      kind: 'concept',
      fieldId: 'johnFootObservations',
      preamble: `### Part 1A: John Travoltage

**Procedure step 1.** Select **John Travoltage** from the simulation picker.

Drag John's foot back and forth across the carpet repeatedly to accumulate charge.

---`,
      prompt:
        "Briefly describe what you observed. What happened to John's charge as you dragged his foot?",
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'johnHandObservations',
      preamble: `**Procedure step 2.** Move John's hand near the doorknob until a spark fires.

Note John's charge meter (the row of electrons in his body) both **before** and **after** the spark.

---`,
      prompt:
        "Briefly describe what you observed. Include the state of John's charge before and after the spark.",
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'johnArmObservations',
      preamble: `**Procedure step 3.** Experiment with different arm positions and distances between John's hand and the doorknob.

---`,
      prompt:
        'Briefly describe what you observed. How did arm position or the distance between hand and doorknob affect when the spark occurred?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'chargingTypeQuestion',
      prompt:
        "Of the three types of charging, which one was used when John's foot was moved back and forth against the carpet? How do you know?",
      points: 1,
    },
    {
      kind: 'instructions',
      pdfHidden: true,
      tocLabel: 'Background: Conservation of Charge',
      html: `## Background: Conservation of Charge

The **Law of Conservation of Charge** states that the net charge of an isolated system stays constant unless charge is exchanged with the outside.

Charge isn't created or destroyed in everyday interactions. It's transferred.

When you charge the balloon by rubbing it on the sweater, watch for this directly: whatever the balloon gains, the sweater loses.`,
    },
    {
      kind: 'concept',
      fieldId: 'balloonSweaterObservation',
      preamble: `### Part 1B: Balloons and Static Electricity

**Procedure step 1.** Select **Balloons and Static Electricity** from the simulation picker.

Rub the balloon on the sweater to transfer charge, then release it and observe its behavior near the sweater.

---`,
      prompt:
        'Briefly describe what you observed. What did the balloon do after being released near the sweater?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'balloonWallObservations',
      preamble: `**Procedure step 2.** Bring the charged balloon near the neutral wall.

Try varying the distance between the balloon and the wall.

---`,
      prompt:
        "Briefly describe what you observed. How did the balloon's behavior change as you varied its distance from the wall?",
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'balloonNoWallObservations',
      preamble: `**Procedure step 3.** Disable the wall and place the charged balloon in the same location where the wall had been.

---`,
      prompt:
        'Briefly describe what you observed. How did the balloon behave differently without the wall, and where did it go?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'balloonSweaterChargeQuestion',
      prompt:
        'After rubbing the balloon on the sweater, how does the charge on the balloon compare to the charge on the sweater?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'balloonWallChargeQuestion',
      prompt:
        'What happens when you bring the charged balloon near the neutral wall? What do the negative charges of the wall do?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'balloonBehaviorQuestion',
      prompt:
        "How does the balloon's behavior change when the wall is removed? Why does it drift back to the sweater instead of staying in place?",
      points: 0.5,
    },
    {
      kind: 'instructions',
      pdfHidden: true,
      tocLabel: 'Background: Polarization vs. Induction',
      html: `## Background: Polarization vs. Induction

In Part 1B you saw the balloon attract to a *neutral wall*. The wall is an insulator, so its electrons can't migrate across the surface; they only shift slightly within each molecule. That's **polarization**: as soon as the balloon leaves, the polarization vanishes and the wall returns to its original state. No net charge is left behind.

---

**Induction** is the analogous process in a *conductor*, where free electrons can travel macroscopically across the whole object.

If you separate part of that conductor (or ground it and then disconnect the ground) *while a charged object is still held nearby*, the rearranged electrons get trapped in their new location. The conductor keeps a real net charge even after the inducing object is removed.

The next simulation lets you watch this happen with two metal cans resting on insulating stands.`,
    },
    {
      kind: 'concept',
      fieldId: 'twoCansInductionObservation',
      preamble: `### Part 1C: Induction in Conductors

**Procedure step 1.** Select **Two-Conductor Induction** from the simulation picker.

This simulation has three controls: **Toggle rod** (brings a charged rod near the cans without touching), **Toggle separation** (moves the cans together or apart), and **Reset**.

Start with the cans together and no rod present. Toggle the rod to bring it near the cans. While the rod is still nearby, toggle separation to move the cans apart. Then toggle the rod again to remove it.

Note the final charge state of each can.

---`,
      prompt:
        'Briefly describe what happened at each step: as the rod approached, as the cans separated, and after the rod was removed.',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'twoCansOrderObservation',
      preamble: `**Procedure step 2: Order matters.** Reset.

Repeat the induction sequence from step 1, but this time **remove the rod first**, *before* separating the cans.

Note the final charge state of each can.

---`,
      prompt:
        'Briefly describe what happened at each step. What was the final charge state of each can?',
      points: 0.5,
    },
    {
      kind: 'concept',
      fieldId: 'inductionChargeSignQuestion',
      preamble:
        'In step 1, after the rod is removed, the two cans carry opposite net charges from each other.\n\n---',
      prompt:
        'Which can ends up with the same sign as the rod, and which ends up with the opposite sign? Explain the electron movement that produces this result.',
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'inductionOrderQuestion',
      prompt:
        "Step 1 and step 2 used the same actions in a different order, and the outcomes were different. Explain why removing the rod first 'undoes' the induction, while separating the cans first locks it in.",
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'polarizationVsInductionQuestion',
      prompt:
        'In Part 1B the wall returned to neutral after the balloon was removed. In Part 1C step 1 the cans kept their net charges after the rod was removed. Both setups involved a charged object held near a neutral object. What is the key physical difference that explains why the outcomes differ?',
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'mechanismSummaryQuestion',
      preamble: `Across this lab you observed five charge-transfer scenarios:

- (a) John's foot rubbing the carpet
- (b) John's hand sparking to the doorknob
- (c) the balloon being rubbed on the sweater
- (d) the charged balloon held near the neutral wall (Part 1B)
- (e) the two cans being separated while the charged rod was held nearby (Part 1C step 1)

---`,
      prompt:
        'Identify which of the three charging mechanisms (friction, conduction, induction) each scenario represents, and justify each in one sentence. If a scenario does not cleanly match any of the three, identify what process it represents and explain why it differs.',
      points: 3,
    },
    {
      kind: 'instructions',
      tocLabel: 'Discussion and Conclusion',
      html: `## Discussion and Conclusion`,
    },
    {
      kind: 'concept',
      fieldId: 'conclusionSummary',
      prompt:
        'In two or three sentences, summarize what this lab demonstrated about how charge can be transferred between objects.',
      points: 1.5,
    },
    {
      kind: 'concept',
      fieldId: 'realWorldApplication',
      prompt:
        'Describe a real-world example of static electricity that you have personally encountered. Identify which charging mechanism is involved, explain how the charge imbalance forms, and describe how it eventually resolves.',
      points: 2,
    },
    {
      kind: 'concept',
      fieldId: 'conclusionReflection',
      prompt:
        'Which concept or result from this lab was most surprising or counterintuitive to you? Explain why.',
      points: 1.5,
    },
  ],
};
