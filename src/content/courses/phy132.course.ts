import type { Course } from '@/domain/schema';

export const phy132Course: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [
    { ref: 'chargeBuildup', labNumber: 1, enabled: true, group: 'core' },
    { ref: 'coulombsLaw', labNumber: 2, enabled: true, group: 'core' },
    { ref: 'pointCharge', labNumber: 3, enabled: true, group: 'core' },
    { ref: 'chargeConfigurations', labNumber: 4, enabled: true, group: 'core' },
    { ref: 'capacitorFundamentals', labNumber: 5, enabled: true, group: 'core' },
    { ref: 'capacitorNetworks', labNumber: 6, enabled: true, group: 'core' },
    { ref: 'ohmsLaw', labNumber: 7, enabled: true, group: 'core' },
    { ref: 'kirchhoffsLaws', labNumber: 8, enabled: true, group: 'core' },
    { ref: 'faradayInduction', labNumber: 9, enabled: true, group: 'core' },
    { ref: 'generator', labNumber: 10, enabled: true, group: 'core' },
    { ref: 'snellsLaw', labNumber: 11, enabled: false, group: 'core' },
    // Retired source drafts (split into the eight new entries above). Kept
    // enabled:false so graders can still reach in-flight student records
    // saved against the original lab IDs.
    { ref: 'chargesFields', enabled: false, group: 'core' },
    { ref: 'capacitors', enabled: false, group: 'core' },
    { ref: 'dcCircuits', enabled: false, group: 'core' },
    { ref: 'magneticFieldFaraday', enabled: false, group: 'core' },
    { ref: 'rcCircuits', enabled: true, group: 'enrichment' },
    { ref: 'rcLowPassFilter', enabled: true, group: 'enrichment' },
    { ref: 'rlHighPassFilter', enabled: true, group: 'enrichment' },
    { ref: 'rlcBandpassFilter', enabled: true, group: 'enrichment' },
    { ref: 'theveninsTheorem', enabled: true, group: 'enrichment' },
  ],
};
