import type { Course } from '@/domain/schema';

export const phy114Course: Course = {
  id: 'phy114',
  title: 'PHY 114',
  storagePrefix: 'phy114',
  parentOriginAllowList: ['https://canvas.asu.edu'],
  labs: [
    // TODO: migrate and enable in later phases.
    { ref: 'staticElectricity', labNumber: 1, enabled: false },
    { ref: 'chargesFields', labNumber: 2, enabled: false },
    { ref: 'capacitors', labNumber: 3, enabled: false },
    { ref: 'dcCircuits', labNumber: 4, enabled: false },
    { ref: 'snellsLaw', labNumber: 5, enabled: true },
    { ref: 'geometricOptics', labNumber: 6, enabled: false },
  ],
};
