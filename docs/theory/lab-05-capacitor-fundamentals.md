# Theory Reference: Capacitor Fundamentals (Lab 5)

**PHY 114 | Lab 5**

Background reading for the Capacitor Fundamentals lab. Covers the definition of
capacitance, the geometry of a parallel-plate capacitor, the relationships among
capacitance, charge, voltage, and stored energy, and what happens when the plate
separation or area is changed with the battery disconnected.

---

## What a Capacitor Does

A **capacitor** is a pair of conductors separated by an insulating gap. When connected
to a battery, the battery pushes charge onto one plate and pulls an equal amount of
charge off the other, creating a positive plate and a negative plate with an electric
field in the gap between them.

The capacitor stores energy in that electric field. When disconnected from the battery
and connected to a load (such as a lightbulb), the stored energy is released as charge
flows back through the external circuit.

---

## Capacitance, Charge, and Stored Energy

The **capacitance** C of a capacitor is the ratio of the charge magnitude Q on either
plate to the voltage V across the capacitor:

Q = C V

The SI unit of capacitance is the **farad** (F), equal to one coulomb per volt. Because
one farad is an extremely large capacitance, real capacitors are typically rated in
microfarads (µF = 10^-6 F) or picofarads (pF = 10^-12 F).

For a parallel-plate capacitor with plate area A and plate separation d in vacuum:

C = ε0 A / d

where ε0 ≈ 8.854 × 10^-12 F/m is the permittivity of free space. Larger plates
increase capacitance; a wider gap decreases it.

The capacitor also stores electrical potential energy U in the field between its plates.
Three equivalent expressions follow from Q = CV:

U = (1/2) C V^2 = (1/2) Q V = (1/2) Q^2 / C

---

## Fixed Voltage vs. Fixed Charge

Two distinct situations arise when the capacitor geometry is changed after charging.

**Battery still connected (fixed V).** The voltage V is locked at the battery's value.
Any change in geometry that alters C causes Q = CV to adjust accordingly: charge flows
between the battery and the plates to maintain the fixed voltage.

**Battery disconnected (fixed Q).** No charge can flow on or off the plates, so Q stays
at its initial value. Changing the geometry then affects V and U:

- **Plate separation increased.** C = ε0 A/d decreases. Since Q is fixed, V = Q/C
  rises. The stored energy U = Q^2/(2C) also rises: you did work pulling the plates
  apart against their mutual attraction, and that work is stored in the field.
- **Plate area decreased.** C decreases. V and U both rise, for the same reason.
- **Plate area increased.** C increases. V = Q/C falls. U = Q^2/(2C) falls, because
  the plates attract less strongly when the overlapping area is larger.

> **Note:** Always identify which quantity is fixed before reasoning about the others.
> The fixed-V and fixed-Q cases predict opposite trends for V and U when C changes.
