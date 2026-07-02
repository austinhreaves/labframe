# Theory Reference: Diverging (Concave) Lens (Lab 11)

**PHY 114 | Lab 11**

Background reading for the Diverging (Concave) Lens lab. Covers the diverging lens and
its negative focal length, the virtual image it always produces, the thin-lens equation
with diverging-lens signs, magnification, the many/principal/marginal ray views, and the
lens-maker equation used in the extra-credit part.

---

## The Diverging Lens and Its Negative Focal Length

A **diverging (concave) lens** is thinner in the middle than at the edges. Where a convex
lens bends parallel rays together, a concave lens spreads them apart.

Rays arriving parallel to the optical axis leave the lens diverging, as if they all came
from a single point on the **object side** of the lens. That point is the diverging
lens's focal point: a **virtual focal point**, since no light actually passes through it.

By convention, this makes the focal length of a diverging lens **negative**:

f < 0 for a diverging lens

Keep this sign in view throughout the lab. The experimental focal length computed from
the thin-lens equation should come out negative, and the lens-maker comparison in the
extra credit only matches if the negative sign is carried consistently on both sides.

---

## The Image a Diverging Lens Always Makes

A converging lens produces different image types depending on where the object sits. A
diverging lens does not: for a real object at **any** distance, the image has the same
three properties.

- **Same side as the object.** The rays leaving the lens spread apart and never cross;
  only their backward extensions intersect, on the object's side of the lens. The image
  is therefore always **virtual** and never switches sides.
- **Always upright.** The rays never cross, so the image is never inverted.
- **Always smaller than the object.** The virtual image forms between the lens and the
  focal point, closer to the lens than the object, and reduced.

Moving the object closer to the lens moves the image slightly closer to the lens and
makes it larger (though still smaller than the object); moving the object away shrinks
the image toward the focal point. Because the image is virtual it cannot be projected on
a screen, but looking through the lens the eye sees the object shrunken and upright,
apparently floating at the image location.

---

## The Thin-Lens Equation with Diverging-Lens Signs

The same thin-lens equation from the converging lens lab applies:

1/f = 1/d₀ + 1/dᵢ

with the same sign conventions:

- d₀ is positive for a real object.
- dᵢ is **negative** for a virtual image (same side as the object). For a diverging lens
  the image is always virtual, so dᵢ is always negative here.
- f then comes out **negative**, as a diverging lens requires.

When measuring in the simulation, record the image distance as a negative number, carry
that sign through the algebra, and check that the computed f is negative. A positive
experimental focal length for a concave lens is the signature of a dropped minus sign.
Distances in the simulation are in centimeters.

---

## Magnification

Magnification is computed the same two ways as before:

M = -dᵢ / d₀ = hᵢ / h₀

For a diverging lens, dᵢ is negative, so M = -dᵢ/d₀ is **positive**: the image is
upright, consistent with observation. Its value is always between 0 and 1, matching the
always-reduced image. The two expressions must agree, which makes the double computation
a consistency check on the measurements.

---

## Many, Principal, and Marginal Rays

Light leaving a single point on the object travels outward in every direction; a ray
diagram is a choice about which of those paths to draw.

- **Many rays** shows a fan of paths: some miss the lens entirely, while the ones that
  strike the lens refract and (for a converging lens) reconverge at the image point. It
  is a reminder that infinitely many paths of light form the image, not just the drawn
  ones.
- **Principal rays** keeps only the three rays whose paths are known by rule: one through
  the center of the lens (essentially undeflected), one arriving parallel to the axis and
  leaving through a focal point, and one aimed at a focal point that leaves parallel to
  the axis. Three rays are enough because any two of them already fix the image location
  and height; the third is a check. This is why hand-drawn ray diagrams use them.
- **Marginal rays** uses the center ray plus the two rays that just graze the top and
  bottom edges of the lens. They show how the finite size of the lens bounds the cone of
  light that forms the image; in real optical systems the marginal rays reveal effects
  like vignetting and spherical aberration.

The simulation shows a two-dimensional slice, so it draws three principal or three
marginal rays; a real three-dimensional lens has a full cone of them around the optical
axis.

For a diverging lens the same constructions apply, with the rays bending away from the
axis; the image is found where the backward extensions of the refracted rays meet.

---

## The Lens-Maker Equation

The focal length of a thin lens is set by its material and the curvature of its two
surfaces. For a lens of refractive index n surrounded by air, the **lens-maker equation**
is

1/f = (n - 1) × (1/R₁ - 1/R₂)

where R₁ and R₂ are the radii of curvature of the first and second surface (in the order
the light meets them). Each radius has a sign: positive when its center of curvature lies
on the far (outgoing) side of the surface, negative when it lies on the incoming side.

The simulation's lenses are symmetric, with both surfaces sharing one radius of curvature
magnitude R, and the signs work out to a simple pair of results:

- **Symmetric convex (converging) lens:** R₁ = +R and R₂ = -R, so
  1/f = (n - 1)(2/R), giving f = R / (2(n - 1)), a positive focal length.
- **Symmetric concave (diverging) lens:** R₁ = -R and R₂ = +R, so
  f = -R / (2(n - 1)), a negative focal length.

These theoretical focal lengths can be compared against the experimental values from the
thin-lens equation with a percent error, |experimental - theoretical| / |theoretical| ×
100%, using each lens's recorded radius of curvature and index of refraction.

> **Note:** The quantity 1/f is called the lens **power**. When f is expressed in meters,
> the power is in **diopters** (1 D = 1 m⁻¹), the unit used in eyeglass prescriptions.
> Converging lenses have positive power, diverging lenses negative power.
