export { phy132SnellsLawLab, snellsLawLab } from './phy132/snellsLaw.lab';
export { phy114SnellsLawLab } from './phy114/snellsLaw.lab';

// Draft labs from the legacy migration (Phase 0). Wired through so they render
// in dev while review is in progress. Re-export prefixed names only — the
// drafts' short aliases (`capacitorsLab` etc.) collide between phy132/phy114.
export { phy132CapacitorsLab } from './phy132/capacitors.draft.lab';
export { phy132ChargesFieldsLab } from './phy132/chargesFields.draft.lab';
export { phy132DcCircuitsLab } from './phy132/dcCircuits.draft.lab';
export { phy132MagneticFieldFaradayLab } from './phy132/magneticFieldFaraday.draft.lab';
export { phy132StaticElectricityLab } from './phy132/staticElectricity.draft.lab';

export { phy114CapacitorsLab } from './phy114/capacitors.draft.lab';
export { phy114ChargesFieldsLab } from './phy114/chargesFields.draft.lab';
export { phy114DcCircuitsLab } from './phy114/dcCircuits.draft.lab';
export { phy114GeometricOpticsLab } from './phy114/geometricOptics.draft.lab';
export { phy114StaticElectricityLab } from './phy114/staticElectricity.draft.lab';
