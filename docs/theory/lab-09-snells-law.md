# Theory Reference: Snell's Law (Lab 9)

**PHY 114 | Lab 9**

Background reading for the Snell's Law lab. Covers the index of refraction, the law
of reflection, Snell's Law relating incident and refracted angles, and total internal
reflection.

---

## The Index of Refraction

Light travels at its maximum speed c ≈ 3.00 × 10^8 m/s in vacuum. Inside any material,
light repeatedly interacts with atoms: each interaction effectively detours the photon,
increasing the total path length. At the macroscopic scale this appears as though the
light is traveling more slowly through the material.

The **index of refraction** n quantifies this slowdown:

n = c / v

where v is the effective speed of light in the material. Because v is always less than
or equal to c, the index of refraction is always greater than or equal to 1. Air has
n ≈ 1.00, water has n ≈ 1.33, and common glass has n ≈ 1.5.

---

## Reflection and Refraction

When light crosses the boundary between two materials, part is **reflected** and part
is **refracted** (bent). All angles are measured from the **normal**: a line
perpendicular to the boundary at the point of incidence.

**Law of Reflection.** The angle of incidence equals the angle of reflection:

theta_1 = theta_1'

**Snell's Law.** The refracted ray obeys:

n1 sin(theta_1) = n2 sin(theta_2)

When light travels from a less dense medium (lower n) into a more dense one (higher n),
the refracted ray bends **toward** the normal: theta_2 < theta_1. When it travels from
a more dense medium into a less dense one, the refracted ray bends **away** from the
normal: theta_2 > theta_1.

---

## Total Internal Reflection

When light travels from a denser medium (n1) into a less dense medium (n2 < n1), there
is a maximum angle of incidence beyond which no refracted ray can exist. At this
**critical angle** theta_c, the refracted ray grazes along the boundary (theta_2 = 90
degrees). Setting theta_2 = 90 degrees in Snell's Law gives:

theta_c = arcsin(n2 / n1)

At any angle of incidence equal to or greater than theta_c, no light crosses into the
second medium: all of it is reflected back into the first medium. This is **total
internal reflection**.

Total internal reflection requires that the light already be in the denser medium
(n1 > n2). It cannot occur when light moves from a less dense medium into a more dense
one, because no critical angle exists in that direction.

> **Note:** Fiber-optic cables rely on total internal reflection. Light injected into a
> glass fiber at a shallow angle bounces off the glass-air boundary repeatedly rather
> than escaping, traveling long distances with very little loss. The same principle
> allows endoscopes and decorative light guides to bend light around corners.
