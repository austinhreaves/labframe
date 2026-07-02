# Theory Reference: Capacitor Networks (Lab 6)

**PHY 114 | Lab 6**

Background reading for the Capacitor Networks lab. Covers equivalent capacitance, the
parallel and series combination rules and where they come from, charge sharing between
capacitors, and the collapse-then-split method for mixed networks.

---

## Equivalent Capacitance

Capacitors are manufactured in standard values, so getting a different value for a
circuit means combining several of them. Any network of capacitors between two terminals
behaves, from the outside, like a single **equivalent capacitor**: one value C_eq that
stores the same total charge at the same applied voltage as the whole network does.

The equivalent value depends on how the capacitors are wired. There are two basic
arrangements, and every larger network is built from them.

---

## Capacitors in Parallel

Capacitors are **in parallel** when both plates of each connect to the same two nodes, so
every capacitor has the same voltage V across it.

Each one stores its own charge, Q₁ = C₁V, Q₂ = C₂V, and so on. The total charge drawn
from the source is the sum:

Q_total = Q₁ + Q₂ + Q₃ + ... = (C₁ + C₂ + C₃ + ...) V

so the equivalent capacitance of a parallel combination is the plain sum:

C_parallel = C₁ + C₂ + C₃ + ...

A parallel combination is always **larger** than any of its members: wiring capacitors in
parallel is effectively adding plate area. The charge divides among them in proportion to
capacitance (the biggest capacitor takes the most charge), while the voltage is the same
on all.

---

## Capacitors in Series

Capacitors are **in series** when they are wired in a single chain, end to end, so the
same charging current must pass through the whole chain.

Series capacitors all carry the **same charge Q**. The reason is charge conservation on
an isolated island: the pair of facing plates between two neighboring series capacitors
is connected to nothing else, so it starts neutral and must stay net-neutral. If +Q
appears on one plate of the pair, exactly -Q must appear on the other. The charge Q is
therefore identical all along the chain.

The voltages, on the other hand, add. Each capacitor has V = Q/C across it, and the total
across the chain is the sum, which gives the reciprocal rule:

1/C_series = 1/C₁ + 1/C₂ + 1/C₃ + ...

A series combination is always **smaller** than its smallest member. And because each
capacitor carries the same Q, the voltage across each is inversely proportional to its
capacitance: the smallest capacitor in the chain takes the largest share of the voltage.

---

## Charge Sharing

Suppose a single capacitor C₁ is charged by a battery to voltage V₀, so it carries charge
Q₀ = C₁V₀. Now disconnect the battery and connect C₁ to one or more **uncharged**
capacitors instead. Two principles decide what happens:

1. **Conservation of charge.** The connected capacitors form an isolated system; the
   total charge Q₀ cannot change, only redistribute.
2. **A common final voltage.** Charge flows until nothing pushes it further, which
   happens when all the connected (parallel) capacitors sit at the same voltage.

For a parallel sharing problem, those two conditions fix the answer. The total charge Q₀
spreads over the combined capacitance, so the final voltage on every connected capacitor
is

V_shared = Q₀ / (C₁ + C₂ + C₃ + ...)

The voltage always drops when another uncharged capacitor joins: the same charge is
spread over more capacitance. Each capacitor's individual share of the charge is then
Q_i = C_i × V_shared.

If sharing happens in stages (first C₁ with C₂, then C₂ with C₃, with switches isolating
the rest), apply the same reasoning one stage at a time: only the capacitors currently
connected share their charge, and any isolated capacitor keeps whatever charge and
voltage it had.

> **Note:** Charge is conserved during sharing, but stored energy is not. Before sharing,
> U = ½Q₀²/C₁; after sharing, U = ½Q₀²/(C₁ + C₂), which is smaller. The missing energy is
> dissipated as heat (and a brief current spike) in the connecting wires while the charge
> redistributes. Conserve charge, not energy, when predicting voltages.

---

## Mixed Series and Parallel Networks

Real networks nest series and parallel sub-blocks. The method is the same as for
resistors: **collapse, solve, split back**.

1. **Collapse.** Replace each series or parallel cluster with its equivalent capacitance,
   working inward until the network is simple enough to solve. For a series pair,
   C₂₃ = (1/C₂ + 1/C₃)⁻¹.
2. **Solve.** Treat the collapsed network as an ordinary sharing or charging problem. For
   example, a charged C₁ sharing with the series pair becomes parallel sharing between C₁
   and C₂₃: V_shared = Q₀ / (C₁ + C₂₃).
3. **Split back.** Undo the collapse to find individual charges and voltages. The
   equivalent C₂₃ carries charge Q₂₃ = C₂₃ × V_shared; because C₂ and C₃ are in series,
   each carries that same charge, and their voltages split in inverse proportion to their
   capacitances: V₂ = Q₂₃/C₂ and V₃ = Q₂₃/C₃, with V₂ + V₃ = V_shared.

Predicted voltages are compared to measured ones with a percent error:
|predicted - measured| / measured × 100%. Small discrepancies can come from the
voltmeter's connection to the circuit and from reading the meter before the redistribution
transient has fully settled.
