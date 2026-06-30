import type { Course } from '@/domain/schema';

export const phy114Course: Course = {
  id: 'phy114',
  title: 'PHY 114',
  storagePrefix: 'phy114',
  parentOriginAllowList: ['https://canvas.asu.edu'],
  labs: [
    // Core E&M. chargeBuildup, chargeConfigurations, capacitorFundamentals,
    // capacitorNetworks, and kirchhoffsLaws reuse the PHY 132 lab objects
    // directly (no uncertainty content to strip). coulombsLaw, pointCharge,
    // and ohmsLaw are PHY-114-owned copies of the 132 labs with uncertainty /
    // error propagation removed (114 is algebra-based).
    { ref: 'chargeBuildup', labNumber: 1, enabled: true, group: 'core' },
    { ref: 'coulombsLaw', labNumber: 2, enabled: true, group: 'core' },
    { ref: 'pointCharge', labNumber: 3, enabled: true, group: 'coming-soon' },
    { ref: 'chargeConfigurations', labNumber: 4, enabled: true, group: 'coming-soon' },
    { ref: 'capacitorFundamentals', labNumber: 5, enabled: true, group: 'coming-soon' },
    { ref: 'capacitorNetworks', labNumber: 6, enabled: true, group: 'coming-soon' },
    { ref: 'ohmsLaw', labNumber: 7, enabled: true, group: 'coming-soon' },
    { ref: 'kirchhoffsLaws', labNumber: 8, enabled: true, group: 'coming-soon' },
    // Optics. snellsLaw is unchanged; geometricOptics is split into the two
    // lens labs below.
    { ref: 'snellsLaw', labNumber: 9, enabled: true, group: 'coming-soon' },
    { ref: 'convergingLens', labNumber: 10, enabled: true, group: 'coming-soon' },
    { ref: 'divergingLens', labNumber: 11, enabled: true, group: 'coming-soon' },
    // Retired source drafts (split into the entries above). Kept enabled:false
    // so graders can still reach in-flight student records saved against the
    // original lab IDs.
    { ref: 'staticElectricity', enabled: false, group: 'core' },
    { ref: 'chargesFields', enabled: false, group: 'core' },
    { ref: 'capacitors', enabled: false, group: 'core' },
    { ref: 'dcCircuits', enabled: false, group: 'core' },
    { ref: 'geometricOptics', enabled: false, group: 'core' },
  ],
};
