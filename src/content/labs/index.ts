// Onboarding tour demo lab (Track D of the onboarding spec). Staged by /welcome.
export { welcomeIntroLab } from './_tour/welcome.lab';

export { phy132SnellsLawLab, snellsLawLab } from './phy132/snellsLaw.lab';
export { phy114SnellsLawLab } from './phy114/snellsLaw.lab';

// Draft labs from the legacy migration (Phase 0). Wired through so they render
// in dev while review is in progress. Re-export prefixed names only — the
// drafts' short aliases (`capacitorsLab` etc.) collide between phy132/phy114.
export { phy132CapacitorsLab } from './phy132/capacitors.draft.lab';
export { phy132ChargeBuildupLab } from './phy132/chargeBuildup.draft.lab';
export { phy132ChargesFieldsLab } from './phy132/chargesFields.draft.lab';
export { phy132CoulombsLawLab } from './phy132/coulombsLaw.draft.lab';
export { phy132DcCircuitsLab } from './phy132/dcCircuits.draft.lab';
export { phy132MagneticFieldFaradayLab } from './phy132/magneticFieldFaraday.draft.lab';

// PHY 132 Tier-A split-pair drafts (created 2026-05-23 by splitting the four
// labs above into eight narrower drafts per docs/handoffs/split-labs-3-7-handoff.md).
// The source drafts are kept enabled:false in the manifest for graders.
export { phy132PointChargeLab } from './phy132/pointCharge.draft.lab';
export { phy132ChargeConfigurationsLab } from './phy132/chargeConfigurations.draft.lab';
export { phy132CapacitorFundamentalsLab } from './phy132/capacitorFundamentals.draft.lab';
export { phy132CapacitorNetworksLab } from './phy132/capacitorNetworks.draft.lab';
export { phy132OhmsLawLab } from './phy132/ohmsLaw.draft.lab';
export { phy132KirchhoffsLawsLab } from './phy132/kirchhoffsLaws.draft.lab';
export { phy132FaradayInductionLab } from './phy132/faradayInduction.draft.lab';
export { phy132GeneratorLab } from './phy132/generator.draft.lab';

// PHY 132 enrichment labs (separate group from the core 1-7 sequence).
export { phy132RcCircuitsLab } from './phy132/rcCircuits.lab';
export { phy132RcLowPassFilterLab } from './phy132/rcLowPassFilter.lab';
export { phy132RlHighPassFilterLab } from './phy132/rlHighPassFilter.lab';
export { phy132RlcBandpassFilterLab } from './phy132/rlcBandpassFilter.lab';
export { phy132TheveninsTheoremLab } from './phy132/theveninsTheorem.lab';

export { phy114CapacitorsLab } from './phy114/capacitors.draft.lab';
export { phy114ChargesFieldsLab } from './phy114/chargesFields.draft.lab';
export { phy114DcCircuitsLab } from './phy114/dcCircuits.draft.lab';
export { phy114GeometricOpticsLab } from './phy114/geometricOptics.draft.lab';
export { phy114StaticElectricityLab } from './phy114/staticElectricity.draft.lab';

// PHY 114 algebra-based copies of three PHY 132 core labs, with the 132
// version's uncertainty / error-propagation content removed (114 does not
// teach it). See each file's header for the exact deletions.
export { phy114CoulombsLawLab } from './phy114/coulombsLaw.draft.lab';
export { phy114PointChargeLab } from './phy114/pointCharge.draft.lab';
export { phy114OhmsLawLab } from './phy114/ohmsLaw.draft.lab';

// PHY 114 optics: structural split of geometricOptics into converging /
// diverging lens labs (snellsLaw stays a separate single-part lab above).
export { phy114ConvergingLensLab } from './phy114/convergingLens.draft.lab';
export { phy114DivergingLensLab } from './phy114/divergingLens.draft.lab';

export { phy112CapacitorsSeriesParallelLab } from './phy112/capacitorsSeriesParallel.lab';
export { phy112ResistorsSeriesParallelLab } from './phy112/resistorsSeriesParallel.lab';
export { phy112KirchhoffsRulesLab } from './phy112/kirchhoffsRules.lab';
