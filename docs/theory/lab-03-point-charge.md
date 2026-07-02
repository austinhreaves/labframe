# Theory Reference: Electric Field & Potential of a Point Charge (Lab 3)

**PHY 114 | Lab 3**

Background reading for the Electric Field & Potential of a Point Charge lab. Covers the
field concept, the inverse-square field of a point charge, electric potential,
equipotential lines, and the straight-line test that extracts kq from a V vs 1/r plot.

---

## The Electric Field

The electric force, like gravity, is a non-contact force: two charges push or pull on
each other across empty space. The **field** concept explains how. A charge modifies the
space around it, creating an **electric field**; any other charge placed in that field
then feels a force from the field at its own location.

The electric field at a point in space is defined by the force a small positive **test
charge** would feel if placed there, divided by the size of that test charge:

E = F / q_test

The SI unit of E is the newton per coulomb (N/C), which is equivalent to the volt per
meter (V/m); the simulation's sensors read the field in V/m. The test charge must be
small enough that it does not disturb the field being measured.

The electric field is a vector: it has a magnitude and a direction at every point. The
direction is the direction of the force on a positive test charge. Field maps drawn with
arrows or field lines show both at once: the arrows point along the field, and the field
is strong where the lines are dense and weak where they spread apart.

---

## Field of a Point Charge

For an isolated point charge q, Coulomb's Law gives the force on a test charge at
distance r, and dividing by the test charge gives the field magnitude:

E = k |q| / r²

with Coulomb's constant k ≈ 8.988 × 10⁹ N·m²/C².

Two features of this formula are worth checking against experiment:

- E is proportional to |q|: doubling the charge doubles the field at any fixed distance.
- E falls off as the inverse square of the distance: doubling r cuts the field to one
  quarter of its value.

The direction is radial: outward from a positive charge, inward toward a negative charge.
By symmetry, sensors placed at the same distance from the charge in different directions
all read the same magnitude; only the direction of the field arrow changes.

When several point charges are present, the total field at any point is the vector sum of
the individual fields (the **superposition principle**). Stacking two identical charges
at the same spot therefore doubles the field everywhere, exactly as if a single charge of
2q sat there.

---

## Electric Potential

A charge sitting in an electric field has electric potential energy, just as a mass in a
gravitational field has gravitational potential energy. The **electric potential** V at a
point is the potential energy per unit charge that a small test charge would have at that
location:

V = PE / q_test

Its unit is the volt: 1 V = 1 J/C (one joule per coulomb).

Potential differs from field in an important way: the field is a vector, but the
potential is a scalar, a single number at each point with no direction attached. That
makes potential easier to map: a single reading per location tells the whole story.

An **equipotential line** is a set of points that all have the same potential. Around a
single point charge the equipotentials are circles centered on the charge (spheres, in
three dimensions), because the potential depends only on the distance r.

---

## Potential of a Point Charge

For a single point charge q, taking the potential to be zero very far away, the potential
at distance r turns out to be

V = k q / r

(You will see where this expression comes from in a calculus-based course; here it is
enough to know the result and test it.) Unlike the field formula, this one keeps the sign
of q: a positive charge produces positive potential around it, a negative charge produces
negative potential.

Note carefully: this is **not** an inverse-square relationship. The potential falls off
as 1/r, while the field falls off as 1/r². Doubling the distance halves the potential but
quarters the field. Confusing the two scalings is the most common error in this topic, so
the lab has you measure both.

---

## The Straight-Line Test

A plot of V against r for a point charge is a falling curve, and a curve by itself does
not identify the law behind it. As in the Coulomb's Law lab, the fix is to change the
x-axis: plot V against 1/r. If the relationship V = kq/r is right, then with x = 1/r the
data obey

V = (kq) × (1/r)

which is a straight line through the origin with slope equal to kq. Reading the slope off
a proportional fit gives an experimental value of kq, which can be compared to the value
computed directly from the known charge and Coulomb's constant, using a percent error:

percent error = |experimental - accepted| / accepted × 100%

Small discrepancies are expected: the equipotential rings may be drawn slightly off the
intended radius, sensor and meter readouts are rounded, and the fit averages over those
imperfections.

> **Note:** The slope of the V vs 1/r line carries units: volts divided by (1/meters),
> which is volt·meters (V·m). The expected value kq also comes out in V·m when q is in
> coulombs, so the two can be compared directly once the charge is converted from
> nanocoulombs: 1 nC = 10⁻⁹ C.

---

## Units in the Simulation

The Charges and Fields simulation uses:

- charge in nanocoulombs (nC), with each placed charge equal to ±1 nC (1 nC = 10⁻⁹ C)
- distance in meters (m), read from the grid or the measuring tape
- electric field in volts per meter (V/m), equivalent to N/C
- electric potential in volts (V)

Coulomb's constant k is in SI units, so convert charges to coulombs before computing
expected values of E, V, or kq.
