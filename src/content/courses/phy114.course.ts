import type { Course } from '@/domain/schema';

export const phy114Course: Course = {
  id: 'phy114',
  title: 'PHY 114',
  storagePrefix: 'phy114',
  parentOriginAllowList: ['https://canvas.asu.edu'],
  labs: [
    { ref: 'staticElectricity', labNumber: 1, enabled: true },
    { ref: 'chargesFields', labNumber: 2, enabled: true },
    { ref: 'capacitors', labNumber: 3, enabled: true },
    { ref: 'dcCircuits', labNumber: 4, enabled: true },
    { ref: 'snellsLaw', labNumber: 5, enabled: true },
    { ref: 'geometricOptics', labNumber: 6, enabled: true },
  ],
};
