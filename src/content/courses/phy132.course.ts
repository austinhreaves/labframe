import type { Course } from '@/domain/schema';

export const phy132Course: Course = {
  id: 'phy132',
  title: 'PHY 132',
  storagePrefix: 'phy132',
  parentOriginAllowList: [],
  labs: [
    { ref: 'staticElectricity', labNumber: 1, enabled: true },
    { ref: 'chargesFields', labNumber: 2, enabled: true },
    { ref: 'capacitors', labNumber: 3, enabled: true },
    { ref: 'dcCircuits', labNumber: 4, enabled: true },
    { ref: 'magneticFieldFaraday', labNumber: 5, enabled: true },
    { ref: 'snellsLaw', labNumber: 6, enabled: true },
  ],
};
