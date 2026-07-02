# Theory Reference: Kirchhoff's Laws & Power (Lab 8)

**PHY 114 | Lab 8**

Background reading for the Kirchhoff's Laws & Power lab. Covers the junction and loop
rules with their sign conventions, real batteries and internal resistance, electric
power, the power delivered to a load, the maximum-power-transfer rule, and the difference
between maximum power and maximum efficiency.

---

## Kirchhoff's Current Law (the Junction Rule)

A **junction** (or node) is a point in a circuit where three or more wires meet. Since
current is a flow of charge and charge cannot pile up or vanish at a point in a steady
circuit, the total current flowing into a junction must equal the total current flowing
out:

sum of I_in = sum of I_out

This is **Kirchhoff's Current Law (KCL)**, a direct consequence of conservation of
charge. Equivalently, give every branch current a reference direction, count currents
into the junction as positive and out as negative, and the signed sum is zero.

If a meter reads a negative current, the actual flow is opposite to the reference
direction that was assumed. That is not an error; record the signed value and the
bookkeeping takes care of itself.

---

## Kirchhoff's Voltage Law (the Loop Rule)

Walk around any closed loop of a circuit and you must return to the potential you started
at. So the algebraic sum of the potential changes around any closed loop is zero:

sum of ΔV around a loop = 0

This is **Kirchhoff's Voltage Law (KVL)**, a consequence of conservation of energy:
voltage is energy per unit charge, and a charge carried around a full loop ends where it
began.

Applying KVL requires a consistent sign convention. Pick a direction to traverse the
loop; then:

- Crossing a battery from the - terminal to the + terminal is a potential **rise**: +ε.
  Crossing it from + to - is a drop: -ε.
- Crossing a resistor **in the same direction as the current** through it is a drop: -IR.
  Crossing it against the current is a rise: +IR.

A circuit with N junctions gives N - 1 independent junction equations, and a two-loop
circuit gives two independent loop equations. Together that is enough algebra to solve
for every unknown current in the network, or, as in this lab, to verify that measured
currents and voltages satisfy both rules.

---

## Real Batteries: EMF and Internal Resistance

An ideal battery would hold a fixed terminal voltage no matter how much current it
supplies. Real batteries do not. A real source is modeled as an ideal EMF ε in series
with a small **internal resistance** r inside the battery itself.

Connect a load resistance R across the terminals and the same current I flows through
both r and R. The loop rule gives:

ε = I r + I R, so I = ε / (R + r)

The voltage actually available at the terminals is the EMF minus the internal drop,
V_terminal = ε - I r, which is why a battery's terminal voltage sags as it delivers more
current.

---

## Electric Power

Power is the rate at which energy is converted from one form to another. For a circuit
element with voltage V across it and current I through it:

P = V × I

measured in watts (1 W = 1 J/s). In a resistor the energy becomes heat. Substituting Ohm's
Law gives two equivalent forms for a resistor:

P = I² R = V² / R

---

## Power Delivered to a Load

Combining P = I²R with I = ε/(R + r) gives the power delivered to the load resistor:

P_R = ε² R / (R + r)²

This curve has a distinctive shape. At very small R, the R in the numerator wins and the
power is tiny (almost everything is dissipated inside the battery). At very large R, the
(R + r)² in the denominator wins and the power falls again (the current becomes tiny).
Somewhere in between the delivered power peaks.

The **maximum-power-transfer theorem** says the peak occurs where the load matches the
source:

R = r

At that matched load the delivered power is

P_max = ε² / (4r)

which follows by substituting R = r into the power formula. In this lab the rule is
verified empirically: sweep R through values bracketing r, plot P_R against R, and read
off where the measured curve peaks.

> **Note:** The power-transfer fit on the plot uses the model P = A·R/(R + B)², which is
> the delivered-power formula with A standing for ε² and B standing for r. A therefore
> carries units of volts squared (V²) and B carries ohms (Ω). The best-fit A gives an
> experimental EMF, ε = √A, and the best-fit B gives an experimental internal resistance,
> each comparable to the values set in the simulation via a percent error.

---

## Maximum Power Is Not Maximum Efficiency

The **efficiency** of the circuit is the fraction of the total generated power that
reaches the load rather than heating the battery:

η = P_R / P_total = R / (R + r)

At the matched load R = r, exactly half the power is wasted inside the source: maximum
power transfer comes with only 50% efficiency. Raising R above r improves the efficiency
(a larger share of the power reaches the load) but lowers the absolute power delivered,
because the total current drops.

The two goals therefore pull in opposite directions, and which one wins depends on the
application. An audio amplifier driving a subwoofer wants maximum loudness, so the
speaker resistance is matched to the amplifier's. A power grid wants minimum waste, so it
operates with the load resistance far above the source resistance.
