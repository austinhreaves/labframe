# Theory Reference: Capacitor Networks (Lab 6)

**PHY 114 | Lab 6**

Background reading for the Capacitor Networks lab. Covers how to find the equivalent
capacitance of parallel and series combinations, how to predict the final voltage when
a charged capacitor shares its charge with uncharged capacitors, and how to handle
mixed series-and-parallel networks.

---

## Combining Capacitors in Parallel

Capacitors wired in **parallel** all have the same voltage across their terminals. The
total charge stored is the sum of the individual charges, so the capacitances add:

C_parallel = C1 + C2 + C3 + ...

A parallel combination always has a larger capacitance than any individual member.

---

## Combining Capacitors in Series

Capacitors wired in **series** carry the same charge on each plate (charge has nowhere
else to go in the chain). The voltages across the capacitors add up to the total
applied voltage, and the reciprocals of the capacitances add:

1/C_series = 1/C1 + 1/C2 + 1/C3 + ...

A series combination always has a smaller capacitance than any individual member.

---

## Charge Sharing

When a charged capacitor C1 is disconnected from the battery and then connected to one
or more initially uncharged capacitors, charge redistributes across all connected
capacitors until every node reaches a single common voltage.

**Conservation of charge** governs this process. The total charge in the isolated
network is the initial charge on C1:

Q0 = C1 V0

For a parallel sharing arrangement (C1 connected in parallel with C2, C3, ...),
all connected capacitors settle to the same voltage:

V_shared = Q0 / (C1 + C2 + C3 + ...)

Each capacitor then holds charge Q_i = C_i · V_shared.

---

## Mixed Series-and-Parallel Networks

When series and parallel sub-blocks are nested, reduce the network from the inside out:

1. Find the equivalent capacitance of each series sub-block using the reciprocal rule.
2. Treat each series sub-block as a single capacitor in the remaining network.
3. Apply the charge-sharing formula to find the post-sharing voltage.
4. Recover the voltage across each original series member using V = Q/C, where Q is
   the charge on the series block and C is the individual capacitor's capacitance.

> **Note:** In a series pair, both capacitors carry the same charge Q but not the same
> voltage. Their voltages split in inverse proportion to their capacitances: the smaller
> capacitor receives the larger voltage share, since V = Q/C.
