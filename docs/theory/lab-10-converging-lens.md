# Theory Reference: Converging (Convex) Lens (Lab 10)

**PHY 114 | Lab 10**

Background reading for the Converging (Convex) Lens lab. Covers how a lens forms images,
the focal point and focal length, real versus virtual images, the thin-lens equation and
its sign conventions, magnification, and the image regimes of a converging lens.

---

## Lenses and the Focal Point

A lens is a shaped piece of transparent material that uses refraction (Snell's Law,
applied at each curved surface) to redirect light in a controlled way. A **converging
(convex) lens** is thicker in the middle than at the edges; it bends incoming rays toward
each other.

Rays that arrive parallel to the optical axis (the horizontal line through the center of
the lens) are bent so that they all pass through a single point on the far side: the
**focal point**. The distance from the lens to the focal point is the **focal length** f.
A converging lens has a focal point on each side, at the same distance, and its focal
length is counted as **positive**.

The focal length is set by the lens itself, by its curvature and its index of refraction,
not by where the object is. Moving the object changes where the image forms, never f.

This lab treats the lens as a **thin lens**: its thickness is small compared to the
object and image distances, so all the bending can be treated as happening at a single
plane through the lens center.

---

## Real and Virtual Images

A lens forms an image where the light rays from each point of the object are brought back
together, or appear to come from.

- A **real image** forms where the refracted rays actually intersect, on the opposite
  side of the lens from the object. Because the light really converges there, a real
  image can be projected onto a screen placed at that spot. Real images formed by a
  single lens are inverted: rays from the top and bottom of the object cross on the way
  to the image.
- A **virtual image** forms where the refracted rays only _appear_ to come from. The rays
  leaving the lens spread apart, but extending them backward, they all trace to a common
  point on the **same side** of the lens as the object. No light actually passes through
  that point, so a virtual image cannot be projected onto a screen; but the eye (itself a
  converging lens) can look through the lens and see it. Virtual images are upright,
  because the rays never cross.

This is the honest test for real versus virtual: ask whether the rays truly intersect at
the image location, or only their backward extensions do.

---

## The Thin-Lens Equation

The object distance d₀ (lens to object), the image distance dᵢ (lens to image), and the
focal length f are linked by the **thin-lens equation**:

1/f = 1/d₀ + 1/dᵢ

The signs carry the geometry:

- d₀ is positive (the object is a real object in front of the lens).
- dᵢ is **positive** for a real image (opposite side of the lens) and **negative** for a
  virtual image (same side as the object).
- f is positive for a converging lens.

Measuring d₀ and dᵢ therefore determines the focal length experimentally: solve the
equation for f, keeping the sign of dᵢ. The distances in the simulation are in
centimeters, so f comes out in centimeters as well.

---

## Magnification

The **magnification** M compares the image to the object. It can be computed two
equivalent ways:

M = -dᵢ / d₀ = hᵢ / h₀

where h₀ is the object height and hᵢ is the image height, with an inverted image counted
as a **negative** height. Magnification is a pure number with no units.

The sign and size of M summarize the image in one number:

- M negative: the image is inverted (this happens for real images, where dᵢ > 0).
- M positive: the image is upright (virtual images).
- |M| > 1: the image is larger than the object; |M| < 1: smaller.

Because the two expressions must agree, computing M both ways is a built-in consistency
check on the four measured values.

---

## The Image Regimes of a Converging Lens

Where the object sits relative to the focal point decides everything about the image.
Sliding the object in from far away, a converging lens with focal length f runs through
these regimes:

- **d₀ > 2f (far outside the focal length).** Real, inverted image on the opposite side,
  smaller than the object, located between f and 2f from the lens.
- **d₀ = 2f.** Real, inverted image at exactly 2f on the other side, the same size as
  the object (M = -1).
- **f < d₀ < 2f.** Real, inverted image beyond 2f, larger than the object. As the object
  approaches the focal point, the image races away from the lens and keeps growing.
- **d₀ = f (at the focal point).** No image forms at any finite distance: the refracted
  rays leave parallel and never converge.
- **d₀ < f (inside the focal length).** The rays diverge after the lens, and the image
  becomes **virtual**: upright, enlarged, on the same side as the object, and farther
  from the lens than the object itself. This is the magnifying-glass configuration.

The moment the object crosses the focal point, the image jumps from "real, inverted, far
away on the other side" to "virtual, upright, on the same side": the most dramatic
transition in the lab, worth watching closely in the simulation.
