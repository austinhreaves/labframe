# Theory Reference: Coulomb's Law (Lab 2)

**PHY 114 | Lab 2**

Background reading for the Coulomb's Law lab. Covers the force law between point charges,
the atomic-scale units used in the simulation, the straight-line method for testing an
inverse-square law, percent error, and the comparison with gravity.

---

## Coulomb's Law

Two charged objects push or pull on each other without touching: the electrostatic force
is a non-contact force that acts across the space between the charges. Experiments show
that like charges repel, unlike charges attract, and the strength of the interaction
depends on only two things: how much charge each object carries and how far apart they
are.

**Coulomb's Law** gives the magnitude of the force between two point charges Q₁ and Q₂
separated by a distance d:

F = k |Q₁ Q₂| / d²

where k is **Coulomb's constant**:

k ≈ 8.988 × 10⁹ N·m²/C²

In words: the force is directly proportional to the product of the two charge magnitudes
and inversely proportional to the square of the distance between them. The force acts
along the line joining the two charges. The absolute-value bars are a reminder that the
formula gives the size of the force; the signs of the charges decide its direction
(toward each other for unlike charges, apart for like charges).

> **Note:** Coulomb's Law applies to **point charges**: objects that are small compared
> to the distance separating them. A uniformly charged sphere also behaves like a point
> charge located at its center whenever the separation is larger than the sphere's
> radius. The charges in the simulation are drawn as small spheres; treat them as point
> charges at their centers, with d measured center to center.

---

## Units on the Atomic Scale

The simulation's Atomic Scale screen uses two units that suit very small systems.

**Elementary charge (e).** The magnitude of the charge on a single proton (positive) or a
single electron (negative):

1 e ≈ 1.602 × 10⁻¹⁹ C

Charge is quantized: every net charge is a whole-number multiple of e. On the atomic
scale it is natural to count charge in units of e. A charge of -3 e, for example, has the
magnitude of three elementary charges and the same sign as an electron's charge.

**Picometer (pm).** A length unit:

1 pm = 10⁻¹² m

For scale, the radius of a hydrogen atom (the Bohr radius) is about 53 pm.

> **Note:** Coulomb's constant k is stated in SI units (newtons, meters, coulombs), so an
> experimental value of k can only be compared to the accepted one after converting:
> charges from e to C, distances from pm to m, and forces into N. Skipping a single
> conversion changes the answer by many powers of ten, so write out every conversion
> factor explicitly.

---

## Reading a Force Law from a Straight Line

A proportionality is easy to test on a graph: data that follow y = Ax fall on a straight
line through the origin, and the slope A can be measured from a fit. Coulomb's Law can be
put in that form in two different ways, depending on which quantity is varied.

### Varying the charge

If Q₁ and d are held constant while Q₂ changes, Coulomb's Law can be regrouped as

F = (k |Q₁| / d²) × Q₂

Everything inside the parentheses is constant, so F is directly proportional to Q₂:
doubling Q₂ doubles F. A plot of F (y-axis) against Q₂ (x-axis) should be a straight line
through the origin with slope

A = k |Q₁| / d²

Measuring A from the fit, and knowing Q₁ and d, gives an experimental value of Coulomb's
constant: k = A d² / |Q₁|.

### Varying the distance

If both charges are held constant while the separation changes, Coulomb's Law predicts
that F is proportional to 1/d²: doubling the distance cuts the force to one quarter.

A plot of F against d itself is a falling curve, and by eye one falling curve looks much
like another; the graph alone cannot distinguish a 1/d law from a 1/d² law. The trick is
to change what is plotted on the x-axis: plot F against 1/d and against 1/d², and look
for which choice straightens the data.

- If the force followed a 1/d law, the F vs 1/d plot would be the straight line.
- If the force follows a 1/d² law, as Coulomb's Law predicts, the F vs 1/d² plot is the
  straight line through the origin and the F vs 1/d plot stays curved.

With x = 1/d², the straight line is F = A x with slope

A = k |Q₁ Q₂|

so the slope gives a second, independent experimental value: k = A / |Q₁ Q₂|.

> **Note:** A slope always carries units: the y-axis unit divided by the x-axis unit. In
> the F vs Q₂ plot, A is a force unit per unit charge; in the F vs 1/d² plot, A is a
> force unit times a distance unit squared. Keeping track of the slope's units is what
> makes the conversion to SI come out right when extracting k.

---

## Percent Error

An experimental value is compared to an accepted value using the percent error:

percent error = |experimental - accepted| / accepted × 100%

A perfect match gives 0%. In this lab, small discrepancies are expected from the
resolution of the simulation's force readout, rounding in the computed 1/d and 1/d²
values, and the quality of the straight-line fit.

---

## Electric Force vs. Gravity

Newton's law of universal gravitation has the same mathematical form as Coulomb's Law:

F = G m₁ m₂ / d², with G ≈ 6.67 × 10⁻¹¹ N·m²/kg²

Both are non-contact, inverse-square laws: the force falls off as 1/d², and it is
proportional to the product of the two quantities that cause it (masses for gravity,
charges for the electric force).

The differences matter just as much:

- Gravity only attracts; there is no negative mass. The electric force can attract or
  repel, depending on the signs of the charges.
- The electric force is far stronger at the particle scale. Coulomb's constant k is
  enormous compared to the gravitational constant G: for two protons, the electric
  repulsion between them is about 10³⁶ times larger than their gravitational attraction.
  That is why gravity is negligible inside atoms, while the electric force is what holds
  atoms and solid matter together.
