# Theory Reference: Charge Configurations (Lab 4)

**PHY 114 | Lab 4**

Background reading for the Charge Configurations lab. Covers the superposition
principle for electric fields, the electric dipole, what makes a field uniform, and
how a parallel-plate geometry produces a nearly uniform field.

---

## The Superposition Principle

When more than one charge is present, the total electric field at any point is the
**vector sum** of the fields from each charge individually:

E_total = E_1 + E_2 + E_3 + ...

This is the **superposition principle**. It means you can always decompose a
complicated charge distribution into simple pieces, compute the field of each piece
separately using E = k|q|/r^2, and add the results as vectors.

The same principle applies to electric potential, but potential is a scalar, so you add
numbers rather than vectors:

V_total = V_1 + V_2 + V_3 + ...

---

## The Electric Dipole

A **dipole** is a pair of equal and opposite charges held a fixed distance apart. The
combined field is the vector sum of each individual field.

In the region between the two charges, both fields point in the same direction (from
positive to negative), so they reinforce each other and the total field is stronger
there. Far away, the two fields partially cancel, and the total falls off faster than
it would from a single charge.

Equipotential surfaces (surfaces of constant V) are always perpendicular to field
lines. For a dipole, the equipotentials are closely spaced near each charge (strong
field) and widely spaced far away (weak field).

---

## Uniform Fields and the Parallel-Plate Geometry

A field is **uniform** in a region if every point in that region has the same magnitude
and the same direction. Visually, a uniform field looks like a regular grid of
identical arrows.

A single dipole produces a field that points roughly from positive to negative in the
central region, but the magnitude varies: the field is stronger near each charge and
weaker in the middle. It approaches uniformity but is not truly uniform.

Stacking several dipoles side by side changes this. Arrange a row of positive charges
on one side and an equal row of negative charges on the other. In the central region
between the two rows, the contributions from all the pairs add together to produce a
field that is nearly uniform: equal magnitude, equal direction, across the whole
interior.

This is the geometry of a **parallel-plate capacitor**. Two effects appear at the
boundaries:

- In the central region the field is nearly uniform and the equipotential surfaces are
  nearly equally spaced.
- At the edges the field curves outward into the surrounding space. This is the
  **fringing field**: non-uniform and weaker than the central field.

The more charge is spread along each plate (and the larger and closer together the
plates are), the more uniform the central field becomes. This is why real parallel-plate
capacitors use large plates to store energy in a controlled, predictable field.
