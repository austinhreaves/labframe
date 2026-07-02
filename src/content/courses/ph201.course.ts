import type { Course } from '@/domain/schema';

// PH 201 is algebra-based (no uncertainty / error propagation) and has no
// Canvas integration at this stage, so the allow list is empty.
export const ph201Course: Course = {
  id: 'ph201',
  title: 'PH 201',
  storagePrefix: 'ph201',
  parentOriginAllowList: [],
  labs: [{ ref: 'n2l-atwood', labNumber: 1, enabled: true, group: 'core' }],
};
