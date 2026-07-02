# Theory Reference: Capacitor Fundamentals (Lab 5)

**PHY 114 | Lab 5**

Background reading for the Capacitor Fundamentals lab. Covers what a capacitor is,
capacitance and the parallel-plate formula, stored charge and energy, what changes when
the geometry changes with the battery connected versus disconnected, and what a lightbulb
discharge actually measures.

---

## What a Capacitor Is

A **capacitor** is a pair of conductors held a fixed distance apart, separated by an
insulator (air, vacuum, or a solid insulating layer). Capacitors are everywhere in
electronics: they store charge in computer memory, smooth out ripples in DC power
supplies, set timing in circuits, and deliver the burst of energy in a camera flash.

When a capacitor is charged, the two conductors carry charges of equal magnitude and
opposite sign, +Q on one and -Q on the other. The capacitor as a whole stays net-neutral;
"the charge on the capacitor" always means the magnitude Q on either plate. An electric
field fills the insulating gap between the conductors, and that field is where the
capacitor's energy is stored.

---

## Capacitance

The **capacitance** C measures how much charge a capacitor holds per volt of potential
difference across it:

C = Q / V, rearranged as Q = C V

The SI unit is the **farad** (F): one coulomb per volt. A farad is an enormous amount of
capacitance, so practical values are quoted in submultiples: the microfarad
(1 μF = 10⁻⁶ F), the nanofarad (1 nF = 10⁻⁹ F), and the picofarad (1 pF = 10⁻¹² F). The
simulation's capacitor is in the picofarad range.

When a capacitor is connected to a battery of voltage V, charge flows onto the plates
until the potential difference across them matches the battery's. The final charge is
Q = CV: a bigger capacitance means more charge stored at the same voltage.

---

## The Parallel-Plate Capacitor

The simplest capacitor is two flat parallel plates, each of area A, separated by a gap of
thickness d. Its capacitance is set entirely by the geometry:

C = ε₀ A / d

where ε₀ ≈ 8.854 × 10⁻¹² F/m is the **permittivity of free space**.

The formula says two things worth testing:

- C is directly proportional to the plate area A: bigger plates hold more charge at the
  same voltage.
- C is inversely proportional to the separation d: closer plates mean a larger
  capacitance. Physically, when the plates are closer, the positive charges on one plate
  pull harder on the negative charges on the other, so more charge can be held at the
  same applied voltage.

> **Note:** The formula is an approximation that holds when the separation d is small
> compared to the size of the plates, so that the fringing field around the edges is
> negligible. A here is the area of overlap of the two plates. The simulation satisfies
> these conditions well.

---

## Stored Energy

Charging a capacitor takes work: each new bit of charge must be pushed onto a plate that
already repels it. That work is stored as electrical potential energy U in the field
between the plates. Starting from Q = CV, the stored energy can be written three
equivalent ways:

U = ½ C V² = ½ Q V = ½ Q² / C

All three describe the same energy; they differ only in which two of the three quantities
(Q, C, V) they use. Choosing the right form is the key reasoning skill of this lab: pick
the form built from the quantities that are held fixed, so that only one factor changes.

---

## Connected vs. Disconnected: What Is Held Fixed

Changing the geometry of a charged capacitor changes C, but what happens to Q, V, and U
depends on **what is held fixed**:

- **Battery connected (fixed V).** The battery pins the voltage across the plates. If C
  changes, the charge follows it: Q = CV, and charge flows between the battery and the
  plates until the voltage matches again. Use the forms with V in them.
- **Battery disconnected (fixed Q).** With no conducting path, no charge can flow on or
  off the plates, so Q is locked at whatever value it had. Now the voltage follows the
  capacitance: V = Q/C. Use the forms with Q in them; for energy, that is U = ½ Q²/C.

The fixed-Q case can produce surprising results. Pull the plates of a disconnected
capacitor apart and C drops, so V = Q/C rises and U = ½Q²/C rises too. The extra energy
is not free: you did work pulling the plates apart against their mutual attraction, and
that work went into the field. Enlarge the plates instead and C rises, so V and U both
fall.

---

## What the Lightbulb Discharge Measures

Discharging a charged capacitor through a lightbulb turns its stored energy into light
and heat, and the discharge is observable two ways: how long the bulb glows and how
bright it starts.

- **Discharge time tracks the capacitance.** A larger C holds more charge at a given
  voltage and takes longer to empty through the bulb; a smaller C drains faster.
- **Initial brightness tracks the starting voltage.** A higher voltage across the plates
  pushes a larger initial current through the bulb, so the flash starts brighter.

Be careful not to read the discharge time as a measure of stored energy. It is not: a
disconnected capacitor whose plates were pulled apart stores more energy than before, yet
it discharges faster, because its capacitance dropped. Time and brightness are evidence
about C and V; the energy must be reasoned out from U = ½Q²/C.

---

## Units in the Simulation

The Capacitor Lab: Basics simulation reports:

- plate separation d in millimeters (1 mm = 10⁻³ m)
- plate area A in square millimeters (1 mm² = 10⁻⁶ m²)
- voltage V in volts
- capacitance C in picofarads (1 pF = 10⁻¹² F)
- plate charge Q in picocoulombs (1 pC = 10⁻¹² C)
- stored energy U in picojoules (1 pJ = 10⁻¹² J)

The constant ε₀ is in SI units (F/m), so convert d and A to meters and square meters
before computing a predicted capacitance, then compare predictions to the sim's readings
with a percent error: |predicted - simulated| / simulated × 100%.
