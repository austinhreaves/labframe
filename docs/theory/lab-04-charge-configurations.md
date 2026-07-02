# Theory Reference: Charge Configurations (Lab 4)

**PHY 114 | Lab 4**

Background reading for the Charge Configurations lab. Covers the superposition principle,
the electric dipole, how equipotential lines relate to field lines, what makes a field
uniform, and how stacking dipoles leads to the parallel-plate geometry used in
capacitors.

---

## The Superposition Principle

When more than one charge is present, the total electric field at any point is the
**vector sum** of the fields produced by each charge individually. This is the
**superposition principle**. Each charge contributes its own radial, inverse-square field
as if the others were not there; the arrows add tip to tail.

Superposition is what makes charge configurations interesting: two charges of the same
size can produce very different field patterns depending on their signs and where they
sit. The shape of the total field is set by the geometry of the charge distribution.

---

## The Electric Dipole

The simplest configuration beyond a single charge is the **electric dipole**: one
positive and one negative charge of equal magnitude held a fixed distance apart.

Between the charges, the two contributions reinforce: the field of the positive charge
points away from it, toward the negative charge, and the field of the negative charge
points toward itself, the same direction. So in the central region the total field points
from + to -, and it is strongest along the line joining the charges.

Away from that central region the two contributions partly cancel and the field weakens
and curves. Field lines leave the positive charge, bend around, and end on the negative
charge. In the middle the field has a clean, predictable direction, but its magnitude is
not constant: it is stronger near each charge and weaker at the midpoint.

---

## Equipotential Lines and Field Lines

An **equipotential line** is a set of points that all have the same electric potential.
Since the potential does not change along an equipotential, no work is needed to move a
charge along one.

That fact fixes the geometry: **field lines always cross equipotential lines at right
angles.** If the field had a component along an equipotential, it would push charges
along the line and do work on them, and the potential would change from point to point
along the line, contradicting "equipotential." So the field can only point straight
across the equipotentials, from higher potential toward lower potential.

The spacing of equipotentials also carries information. Where equipotential lines drawn
at equal potential steps crowd together, the potential is changing rapidly with distance
and the field is strong; where they spread far apart, the field is weak. For a region of
uniform field, the relationship is a simple ratio: the field magnitude equals the
potential difference divided by the distance over which it changes,

E = ΔV / d

which is why the unit V/m is the same thing as N/C.

---

## What Makes a Field Uniform?

A field is **uniform** in a region if the vectors at every point in that region have the
same magnitude and the same direction. Visually, a uniform field looks like a regular
grid of identical arrows; its equipotentials are straight, parallel, evenly spaced lines
perpendicular to the arrows.

A single dipole does not achieve this. In the central region the direction is roughly
constant, but the magnitude varies: close to uniform, not quite.

The fix is to spread the charge out. Stack several dipoles in parallel, so that a line of
positive charges faces a line of negative charges. Each point in the central region now
receives contributions from many charge pairs; by superposition, the variations of the
individual contributions largely cancel, and the total field in the middle becomes nearly
constant in both magnitude and direction. The more charges along each line and the more
evenly they are spaced, the more uniform the central field becomes.

Near the edges of the lines the cancellation fails and the field bulges outward and
curves. These edge regions are called **fringing fields**. They are the price of building
a uniform field from a finite charge distribution.

---

## From Stacked Dipoles to Parallel Plates

Two parallel lines (or, in three dimensions, sheets) of equal and opposite charge are the
seed of the **parallel-plate capacitor**, the device studied in the next lab. Its key
property is exactly the one built here: away from the edges, the field between the plates
is uniform, pointing from the positive plate to the negative plate, and the
equipotentials between the plates are evenly spaced parallel lines.

Geometry also decides how effective a configuration is at storing energy in its field. An
electric field stores energy throughout the region it fills. Two point charges produce a
strong field only in the small region close to them; the field, and with it the stored
energy, is concentrated in a tiny volume and falls off quickly. Two parallel lines or
sheets of charge fill the entire region between them with a strong, uniform field, so far
more field energy fits in the same footprint. That is why capacitors are built from
facing plates rather than from pairs of point charges.
