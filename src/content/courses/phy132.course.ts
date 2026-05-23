import type { Course } from '@/domain/schema';

export const phy132Course: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [
    { ref: 'chargeBuildup', labNumber: 1, enabled: true, group: 'core' },
    { ref: 'coulombsLaw', labNumber: 2, enabled: true, group: 'core' },
    { ref: 'chargesFields', labNumber: 3, enabled: true, group: 'core' },
    { ref: 'capacitors', labNumber: 4, enabled: true, group: 'core' },
    { ref: 'dcCircuits', labNumber: 5, enabled: true, group: 'core' },
    { ref: 'magneticFieldFaraday', labNumber: 6, enabled: true, group: 'core' },
    { ref: 'snellsLaw', labNumber: 7, enabled: true, group: 'core' },
    { ref: 'rcCircuits', enabled: true, group: 'enrichment' },
    { ref: 'rcLowPassFilter', enabled: true, group: 'enrichment' },
    { ref: 'rlHighPassFilter', enabled: true, group: 'enrichment' },
    { ref: 'rlcBandpassFilter', enabled: true, group: 'enrichment' },
    { ref: 'theveninsTheorem', enabled: true, group: 'enrichment' },
  ],
};
