# Theory Reference: Kirchhoff's Laws and Power (Lab 8)

**PHY 114 | Lab 8**

Background reading for the Kirchhoff's Laws and Power lab. Covers the two Kirchhoff
rules that govern any DC circuit, the sign conventions for applying them, electric power
in DC circuits, and the maximum-power-transfer theorem for a non-ideal battery driving
a variable load.

---

## Kirchhoff's Current Law

Two conservation laws govern every DC circuit, no matter how complex. The first is
**Kirchhoff's Current Law (KCL)**, which follows from conservation of charge.

At any **junction** (a point where three or more wires meet), the total current flowing
into the junction equals the total current flowing out:

Sum I_in = Sum I_out

Equivalently, if you assign a reference direction to each branch current, the signed
sum of all currents at a junction is zero: currents toward the junction are positive,
currents away are negative.

---

## Kirchhoff's Voltage Law

The second rule is **Kirchhoff's Voltage Law (KVL)**, which follows from conservation
of energy.

The algebraic sum of the potential changes around any closed loop is zero:

Sum (Delta V) = 0 around any closed loop

Sign convention when traversing a loop in a chosen direction:

- Crossing a battery from the negative terminal to the positive terminal: potential
  rises by epsilon (the EMF). Contribute +epsilon.
- Crossing a battery from positive to negative: potential drops. Contribute -epsilon.
- Crossing a resistor in the same direction as the branch current I: potential drops.
  Contribute -I R.
- Crossing a resistor against the direction of the branch current: potential rises.
  Contribute +I R.

A two-loop circuit yields two independent KVL equations and one independent KCL
equation, which together are enough to solve for every unknown current.

---

## Power in DC Circuits

The **electric power** delivered to a circuit element is the rate at which electrical
energy is converted into another form (heat, light, mechanical motion, etc.). For any
element with voltage V across it and current I through it:

P = V I

For a resistor obeying Ohm's Law (V = IR), two equivalent forms follow:

P = I^2 R = V^2 / R

The SI unit of power is the **watt** (W), equal to one joule per second. When current
flows through a resistor, all of that power appears as heat in the resistor.

---

## Non-Ideal Batteries and Maximum Power Transfer

An ideal battery maintains a fixed terminal voltage regardless of the current it
supplies. A real battery behaves instead like an ideal EMF epsilon in series with a
small **internal resistance** r inside the battery casing.

When a load resistance R is connected across the terminals, Kirchhoff's loop rule
gives:

I = epsilon / (R + r)

The power delivered to the load is:

P_R = I^2 R = epsilon^2 R / (R + r)^2

This expression has an interesting shape as R varies:

- When R is much smaller than r, most of the voltage drops across r and very little
  reaches the load, so P_R is small.
- When R is much larger than r, the current is small, so P_R is again small.
- Somewhere between these extremes is a maximum.

The **maximum-power-transfer theorem** states that the load power peaks when R = r:
the load resistance equals the source's internal resistance.

> **Note:** Maximum power transfer (R = r) is not the same as maximum efficiency.
> Efficiency is the fraction P_R / P_total of the total source power that reaches the
> load. At R = r, efficiency is exactly 50%. Efficiency rises toward 100% as R grows
> much larger than r, but the power delivered to the load falls toward zero. Maximum
> power and maximum efficiency cannot both be achieved at the same operating point.
