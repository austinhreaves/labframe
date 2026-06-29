# Theory Reference: Continuity and Ohm's Law (Lab 7)

**PHY 114 | Lab 7**

Background reading for the Continuity and Ohm's Law lab. Covers the distinction
between conductors, insulators, and resistive materials; the definition of resistance;
Ohm's Law and the I-V characteristic; and the difference between ohmic and
non-ohmic materials.

---

## Conductors, Insulators, and Resistance

An **electric current** is a flow of charge driven by a potential difference. How easily
charge flows through a material is captured by its **resistance**: the ratio of the
voltage across the material to the current through it.

Three broad categories cover most everyday materials:

**Conductors** (mostly metals) have very low resistance. Their electrons are free to
move throughout the entire object, so current flows with very little opposition. When a
conductor is connected across a circuit, it provides an easy path for charge and can
draw more current than the rest of the circuit was designed to handle.

**Insulators** (rubber, dry wood, most plastics) have extremely high resistance.
Electrons in an insulator are tightly bound and cannot travel through the bulk of the
material; current is effectively blocked.

**Resistive materials** sit between these extremes. Graphite (pencil lead) is a classic
example: it conducts, but with measurable resistance.

A **fuse** is a deliberately weak link placed in series with a circuit. When the current
exceeds the fuse's rated value, the fuse element overheats and breaks the circuit,
protecting other components downstream.

---

## Ohm's Law

For many materials over a moderate range of conditions, the voltage V across an object
and the current I through it are directly proportional:

V = I R

where the constant of proportionality R is the object's **resistance**. The SI unit of
resistance is the **ohm** (Ω), defined as one volt per ampere. Equivalent forms:

I = V / R     R = V / I

Plotting I on the vertical axis against V on the horizontal axis for an object that
obeys this law gives a straight line through the origin. The slope of that line is 1/R;
the reciprocal of the slope gives the resistance.

---

## Ohmic vs. Non-Ohmic Materials

A material is **ohmic** if its resistance stays constant over its working range: the
I-V curve is a straight line through the origin. A graphite pencil lead behaves this
way over a wide range of voltages.

A material is **non-ohmic** if its resistance changes with current or voltage: the I-V
curve bends. The most familiar example is an incandescent lightbulb. As current
increases, the tungsten filament heats up. Hotter metal resists current more strongly.
The slope of the I-V curve therefore decreases at higher currents, bending the curve
away from a straight line.

As a consequence, a non-ohmic device does not have a single fixed resistance. The slope
of the I-V curve at a specific operating point gives the resistance only near that
point; the slope of the entire curve gives an average over the full range, which is
dominated by the high-current end where the filament is hottest.

> **Note:** Two fits appear on the Ohm's Law graph: a proportional fit (y = mx,
> passing through the origin) and a linear fit (y = mx + b, with a free intercept). For
> a truly ohmic device the two fits should be nearly identical. A large difference
> between them suggests the data do not pass through the origin, which can indicate
> non-ohmic behavior or a systematic offset in the measurement.
