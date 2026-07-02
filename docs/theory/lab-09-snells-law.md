# Theory Reference: Snell's Law (Lab 9)

**PHY 114 | Lab 9**

Background reading for the Snell's Law lab. Covers the index of refraction, the laws of
reflection and refraction, the sin-sin straight-line method for measuring an unknown
index, total internal reflection and the critical angle, and the percent difference used
to compare two measurements.

---

## The Index of Refraction

Light travels at c = 299,792,458 m/s in vacuum, but it effectively moves slower inside a
material: as the light passes through, it interacts with the material's atoms, and the
accumulated delays make the beam advance more slowly than it would in empty space. The
**index of refraction** n of a material compares the two speeds:

n = c / v

where v is the speed of light in the material. Because v never exceeds c, the index of
refraction is always greater than or equal to 1. Air has n very close to 1; water is
about 1.33; typical glass is around 1.5. A material with a higher index is called
**optically denser** (this is shorthand for "higher n"; it does not always track mass
density in real materials).

---

## Reflection and Refraction at a Boundary

When a beam of light strikes the boundary between two materials, part of it bounces back
(**reflection**) and part crosses into the second material with a changed direction
(**refraction**). Usually both happen at once.

All the angles in this topic are measured from the **normal**: the line perpendicular to
the boundary at the point where the beam hits, shown as the vertical dotted line in the
simulation.

**Law of reflection.** The reflected beam leaves at the same angle the incident beam
arrived:

θ₁' = θ₁

**Snell's Law.** The refracted angle θ₂ in the second material is related to the incident
angle θ₁ by:

n₁ sin θ₁ = n₂ sin θ₂

The direction of the bend follows from the indices. Going into an optically denser
material (n₂ > n₁), the beam bends **toward** the normal; going into a less dense
material (n₂ < n₁), it bends **away** from the normal. If n₁ = n₂ the beam does not bend
at all: as far as the light is concerned, there is no boundary.

---

## Measuring an Unknown Index with a Straight Line

Snell's Law can be rearranged to isolate the unknown. If light passes from a known
material n₁ into an unknown material (call its index n_A), then

sin θ_A = (n₁ / n_A) × sin θ₁

This is a proportionality between the two sines. Plotting sin θ_A (the refracted-angle
sine, y-axis) against sin θ₁ (the incident-angle sine, x-axis) for several incident
angles should give a straight line through the origin with slope

A = n₁ / n_A

so the unknown index is n_A = n₁ / A. The proportional fit (y = Ax) is the physically
right choice here: when the incident angle is zero, the refracted angle is zero too, so
the true line must pass through (0, 0).

Note that both sines and the slope are pure numbers with no units, and indices of
refraction are unitless as well; the only unit in the lab is the degree on the measured
angles.

---

## Total Internal Reflection

When light travels from an optically denser medium into a less dense one (n₁ > n₂),
Snell's Law demands a refracted angle larger than the incident angle. Push the incident
angle high enough and the predicted refracted angle reaches 90 degrees: the refracted
beam grazes along the boundary itself. The incident angle where this happens is the
**critical angle** θ_c. Setting θ₂ = 90 degrees (so sin θ₂ = 1) in Snell's Law gives:

sin θ_c = n₂ / n₁, so θ_c = arcsin(n₂ / n₁)

For any incident angle at or beyond θ_c there is no refracted beam at all; every bit of
the light is reflected back into the denser medium. This is **total internal
reflection**. It can only happen when n₁ > n₂: otherwise n₂/n₁ exceeds 1 and no angle has
a sine that large.

Total internal reflection is the basis of fiber optics: light injected into a glass fiber
at a steep enough angle reflects off the fiber walls completely, over and over, and is
carried along the fiber with almost no loss.

Measuring θ_c gives a second, independent route to an unknown index: with n₂ known, the
critical angle determines n₁ = n₂ / sin θ_c.

---

## Percent Difference

When two experimental values of the same quantity are compared (rather than an
experimental value against an accepted one), the comparison is the **percent
difference**: the gap between them divided by their average,

percent difference = |a - b| / ((a + b) / 2) × 100%

A small percent difference between the slope-based and critical-angle-based values of the
same index is a consistency check: two different methods agreeing is much stronger
evidence than either method alone.
