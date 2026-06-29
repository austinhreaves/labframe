# Theory Reference: Diverging (Concave) Lens (Lab 11)

**PHY 114 | Lab 11**

Background reading for the Diverging Lens lab. Covers how a diverging lens always
forms a virtual image, the thin lens equation for negative focal lengths, magnification,
the distinction between principal and marginal rays, and the lens-maker equation.

---

## How a Diverging Lens Works

A **diverging lens** (also called a concave or negative lens) is thinner at its center
than at its edges. When parallel rays of light enter from one side, the lens refracts
them so they spread outward, as if they originated from a point on the incoming side.
That point is the **focal point** of the diverging lens, and its distance from the lens
is the **focal length** f. For a diverging lens, f is **negative** by convention.

---

## Images Formed by a Diverging Lens

A diverging lens always produces a **virtual, upright, smaller** image, regardless of
where the object is placed. The image always appears on the same side of the lens as
the object (di < 0).

The thin lens equation applies with the same form used for a converging lens:

1/f = 1/d0 + 1/di

where f is negative for a diverging lens and d0 is positive. Solving for di always
yields a negative value, confirming the image is virtual.

Magnification has the same formulas:

M = -di / d0 = hi / h0

Since di < 0 and d0 > 0, the magnification M is always positive (upright image) and
|M| < 1 (the image is smaller than the object).

---

## Principal and Marginal Rays

Ray diagrams provide a visual method for locating images without algebra.

**Principal rays** are three specific rays that follow simple rules through the lens:

1. A ray parallel to the optical axis diverges after passing through the lens as if it
   came from the near focal point (on the same side as the incoming light).
2. A ray directed toward the center of the lens passes straight through without
   bending.
3. A ray aimed at the far focal point emerges parallel to the optical axis on the other
   side.

The backward extensions of any two of these diverging rays intersect at the virtual
image location.

**Marginal rays** are two rays that strike the outer edges of the lens, plus the center
ray. They reveal how the finite size of the lens bounds the refracted light and can
expose effects such as spherical aberration in real optical systems.

Either ray set is sufficient to locate the image; principal rays are simpler for quick
diagrams, while marginal rays are more useful when studying lens quality.

---

## The Lens-Maker Equation (Extra Credit)

The focal length of a thin lens can be computed from the refractive index of the lens
material and the radii of curvature of its two surfaces:

1/f = (n - 1) [1/R1 - 1/R2]

where n is the refractive index of the lens material (surrounding medium is air,
n_air = 1), R1 is the radius of curvature of the first surface (positive if that
surface bulges toward the incoming light), and R2 is the radius of curvature of the
second surface (positive if it bulges away from the incoming light).

For a symmetric double-concave lens with both surfaces curving inward by the same
amount (|R1| = |R2| = R), R1 is negative and R2 is positive, so the bracket is
negative and f comes out negative, consistent with a diverging lens.

> **Note:** The sign convention for the lens-maker equation follows the same rule as
> the thin lens equation: distances are positive on the transmission side and negative
> on the incoming side. When in doubt, sketch the lens and label which direction is
> which before substituting values.
