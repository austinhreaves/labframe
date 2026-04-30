# Snell's Law Legacy Parity Inventory

This matrix maps legacy `phy_114/snellsLaw` content to schema targets before Phase 1 renderer work.

## Legacy source checkpoints

- `physics-labs.up.railway.app/phy_114/snellsLaw/LabReportForm.js`
- `physics-labs.up.railway.app/phy_114/snellsLaw/labConfig.js`

## Required parity structure

1. Objective prompt + objective response field.
2. Part 1:
   - 3-row table: incident/refracted/reflected angles.
   - n2 measurement.
   - angle-comparison question.
   - sample Snell calculation question.
3. Part 2 (Mystery A):
   - n1 measurement.
   - 5-row table with incident/refracted + derived sin columns.
   - proportional fit plot.
   - slope + uncertainty + units capture.
   - n2 calculation prompt.
4. Part 3 (Mystery B):
   - mirrors Part 2 with its own IDs and prompts.
5. Part 4 (total internal reflection):
   - screenshot upload + caption.
   - critical-angle measurement.
   - critical-angle n-calculation.
   - percent-difference comparison with slope method.
6. Concept checks:
   - four distinct prompts with legacy wording.
7. Discussion & conclusion:
   - rubric-referenced long-form response.
8. Simulation metadata parity:
   - PhET Bending Light title + `bending-light_all.html` URL.
