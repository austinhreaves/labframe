# Theory Reference: Electric Field & Potential of a Point Charge (Lab 3)

**PHY 114 | Lab 3**

Background reading for the Electric Field and Potential lab. Covers the electric field
concept, how field strength falls off with distance from a point charge, equipotential
surfaces, and the electric potential of a point charge.

---

## The Electric Field

A charged particle modifies the space around it. Rather than thinking of a force that
acts directly between two distant objects, physicists introduce the concept of a
**field**: a quantity defined at every point in space that tells you what a test charge
placed there would experience.

The **electric field** E at a point is defined as the electrostatic force F that an
infinitesimally small positive test charge q0 would feel at that location, divided by
q0:

E = F / q0

The SI unit of electric field is newtons per coulomb (N/C), equivalent to volts per
meter (V/m).

For a single point charge q, Coulomb's Law gives the magnitude of the field at
distance r:

E = k |q| / r^2

where k ≈ 8.988 × 10^9 N·m^2/C^2. The field points **radially outward** from a
positive charge and **radially inward** toward a negative charge. Its magnitude falls
off as the inverse square of the distance.

When more than one charge is present, the total field at any point is the **vector
sum** of the fields from each charge individually. This is the **superposition
principle**.

---

## Equipotential Surfaces

An **equipotential surface** is the set of all points in space that share the same
electric potential. No work is required to move a charge along an equipotential
surface, which means the electric force has no component in that direction.

A direct consequence is that electric field lines are always **perpendicular** to
equipotential surfaces. Where equipotential surfaces are closely spaced, the potential
changes rapidly and the field is strong; where they are widely spaced, the field is
weak.

For a single positive point charge, the equipotential surfaces are concentric spheres.
Field lines radiate outward from the charge and cross each sphere at a right angle.

---

## Electric Potential of a Point Charge

The **electric potential** V at a point is the electric potential energy that a unit
positive charge would have at that location. Its unit is the volt (V), defined as one
joule per coulomb (J/C).

For a single point charge q, the electric potential at distance r is:

V(r) = k q / r

This is a 1/r relationship, not a 1/r^2 relationship like the field. A direct V-vs-r
plot is therefore a curve.

To extract k q experimentally from data, the standard approach is to plot V against
1/r. If V = (k q) · (1/r) holds, the plot is a straight line through the origin with
slope k q. Comparing this experimental slope to the value computed directly from the
known q and k gives a test of the formula.

> **Note:** The electric field always points in the direction of decreasing potential:
> field lines run from high-potential regions toward low-potential regions. Equivalently,
> a positive charge released from rest will accelerate in the direction the field points,
> which is downhill in potential.
