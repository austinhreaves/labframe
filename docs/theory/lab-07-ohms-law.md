# Theory Reference: Continuity & Ohm's Law (Lab 7)

**PHY 114 | Lab 7**

Background reading for the Continuity & Ohm's Law lab. Covers current, voltage, and
resistance; conductors, insulators, and fuses; Ohm's Law and the I-vs-V plot; resistors
in series; and why a real lightbulb is non-ohmic.

---

## Current, Voltage, and Resistance

An **electric current** I is a flow of charge through a conductor, measured in amperes
(1 A = 1 C/s). A **DC** (direct current) circuit is one where the current keeps a
constant direction and magnitude. What drives the flow is a potential difference, or
**voltage** V, across the circuit element, supplied here by a battery.

Every object opposes the flow of charge to some degree. That opposition is the object's
**resistance** R. On the atomic level it comes from the moving electrons repeatedly
colliding with the fixed atoms of the material, which scatters them and turns some of
their energy into heat.

Resistance belongs to a specific object; the underlying material property is called
**resistivity**. A long, thin wire of a material has more resistance than a short, thick
one of the same material: resistance grows with length and shrinks with cross-sectional
area.

---

## Conductors, Insulators, and Everything Between

Three broad behaviors cover most everyday objects:

- **Conductors** (most metals, like a steel paper clip) have very low resistance. Placing
  a conductor across a circuit lets current flow freely, often far more current than the
  circuit was designed to carry.
- **Insulators** (rubber, dry wood, most plastics, a rubber eraser) have extremely high
  resistance. They effectively block current: connecting one into a branch is nearly the
  same as leaving the branch open.
- **Resistive materials** sit between the extremes. Graphite pencil lead is the classic
  example: it conducts, but far less well than a copper wire, so it lets a moderate
  current flow.

A **fuse** is a deliberately weak link wired in series with a circuit. If the current
through it exceeds its rating, the fuse burns out and breaks the circuit, protecting
everything else. A fuse blowing is direct evidence that something in the circuit had low
enough resistance to let a large current flow.

---

## Ohm's Law

For many materials, over a moderate working range, the voltage across an object and the
current through it are directly proportional:

V = I R

with R constant. The SI unit of resistance is the **ohm** (Ω), equal to one volt per
ampere. The same relation rearranges to I = V/R and R = V/I.

A device that obeys this proportionality with a single constant R is called **ohmic**.
The graphical signature is the cleanest test: plot the current I (y-axis) against the
voltage V (x-axis). For an ohmic device the data fall on a straight line through the
origin, and since I = (1/R) V, the slope of that line is

slope = 1/R

so the resistance is the reciprocal of the slope: R = 1/slope. The slope carries units of
amperes per volt, which makes its reciprocal come out in volts per ampere, that is, in
ohms.

A straight-line fit that passes through the origin (a proportional fit, y = mx) and a
general straight-line fit (y = mx + b) should agree closely for a truly ohmic device,
with the intercept b near zero: zero voltage drives zero current.

---

## Resistors in Series

When two resistors are wired in series, the same current passes through both, and their
voltage drops add. The combination behaves like a single equivalent resistor equal to the
sum:

R_total = R₁ + R₂

This is how one unknown resistance can be extracted from a measurement of a pair. If a
known resistor R is in series with a pencil lead of unknown resistance R_p, the I-vs-V
data for the pair give a slope of 1/(R + R_p). So

R + R_p = 1/slope, and R_p = 1/slope - R

---

## Non-Ohmic Devices: the Real Lightbulb

Not every device is ohmic. A **non-ohmic** device has no single constant R: its
resistance changes with the current through it, and its I-vs-V plot bends instead of
staying straight.

The most familiar example is an incandescent lightbulb. Its filament is a thin metal
wire, and the resistance of a metal rises with temperature. As the applied voltage
increases, more current flows, the filament heats up (that is what makes it glow), and
its resistance climbs. Each extra volt therefore buys less extra current than the one
before: the I-vs-V curve starts steep and gradually flattens at higher voltage.

For a curved I-vs-V plot, the idea of resistance still works, but only locally: the slope
of a small section of the curve gives 1/R for the conditions in that section. A section
at low voltage (cool filament) has a steep slope, meaning low resistance; a section at
high voltage (hot filament) has a shallow slope, meaning high resistance. A single
straight line forced through the whole curve yields only a rough average resistance over
the sweep, not a property of the bulb at any one operating point.
