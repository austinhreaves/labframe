# Theory Reference: Coulomb's Law (Lab 2)

**PHY 114 | Lab 2**

Background reading for the Coulomb's Law lab. Covers the electrostatic force law, the
atomic-scale units used in the simulation, the inverse-square relationship, and a
comparison of electrical and gravitational forces.

---

## Coulomb's Law

The electrostatic force between two point charges is a non-contact force: neither
object needs to touch the other for the force to act. Its magnitude depends on the
product of the charges and the inverse square of the distance between them:

F = k |Q1 Q2| / d^2

where k is **Coulomb's constant**:

k ≈ 8.988 × 10^9 N·m^2/C^2

The force is **attractive** when the two charges carry opposite signs and **repulsive**
when they carry the same sign. Its direction lies along the line connecting the two
charges.

---

## Units Used in the Atomic-Scale Simulation

The PhET simulation's Atomic Scale screen uses two units that may be unfamiliar.

**Elementary charge (e).** The magnitude of the charge on a single proton (positive) or
electron (negative). It is the smallest unit of charge that exists in nature:

1 e ≈ 1.602 × 10^-19 C

Because charge comes in whole-number multiples of e, a charge of -3 e means an excess
of exactly three electrons.

**Picometer (pm).** A unit of length equal to 10^-12 m. Atomic distances fall naturally
in this range: the hydrogen atom's Bohr radius is about 53 pm.

> **Note:** Coulomb's constant k is in SI units (N·m^2/C^2). When you extract k from
> your data, convert your charges from e to C and your distances from pm to m before
> substituting into the equation.

---

## The Inverse-Square Law

Coulomb's Law predicts that force scales as 1/d^2 when the charges are held constant.
A direct F-vs-d plot is therefore a curve: the force rises steeply at small separations
and tapers off at large ones.

To verify the inverse-square law from data, the standard approach is to plot F against
1/d^2. If the relationship is correct, that plot is a straight line through the origin.
A plot of F vs. 1/d is curved for Coulomb's Law, which rules out a simple 1/d
dependence.

Comparing F-vs-1/d and F-vs-1/d^2 side by side is the diagnostic test: only one will
be linear.

---

## Comparing Electrical and Gravitational Forces

The form of Coulomb's Law closely mirrors Newton's Law of Universal Gravitation:

Gravitational:  F = G m1 m2 / r^2     G ≈ 6.67 × 10^-11 N·m^2/kg^2
Electrostatic:  F = k |Q1 Q2| / r^2   k ≈ 8.988 × 10^9 N·m^2/C^2

Both forces follow an inverse-square law and depend on the product of the interacting
quantities (masses or charges). The key structural differences:

- Gravity is always attractive; the electrostatic force can be either attractive or
  repulsive, depending on the signs of the charges.
- k is roughly 20 orders of magnitude larger than G. As a result, electrostatic forces
  between charged particles dwarf gravitational forces between them by an enormous
  factor. Electrical forces, not gravity, hold atoms together and determine the
  mechanical properties of matter.
