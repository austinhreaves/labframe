import type { Course } from '@/domain/schema';

export const generalCourse: Course = {
  id: 'general',
  title: 'Interactive Physics Labs',
  storagePrefix: 'general',
  parentOriginAllowList: [],
  labs: [
    { ref: 'snellsLaw', labNumber: 1, enabled: true },
    // TODO: migrate and enable in later phases.
    { ref: 'staticElectricity', labNumber: 2, enabled: false },
    { ref: 'chargesFields', labNumber: 3, enabled: false },
    { ref: 'capacitors', labNumber: 4, enabled: false },
    { ref: 'dcCircuits', labNumber: 5, enabled: false },
    { ref: 'magneticFieldFaraday', labNumber: 6, enabled: false },
  ],
};
