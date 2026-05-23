import type { Course } from '@/domain/schema';

export const phy112Course: Course = {
  id: 'phy112',
  title: 'PHY 112',
  storagePrefix: 'phy112',
  parentOriginAllowList: ['https://canvas.asu.edu'],
  labs: [
    { ref: 'capacitorsSeriesParallel', labNumber: 1, enabled: true },
    { ref: 'resistorsSeriesParallel', labNumber: 2, enabled: true },
    { ref: 'kirchhoffsRules', labNumber: 3, enabled: true },
    { ref: 'dcCircuitAnalysis', labNumber: 4, enabled: false },
    { ref: 'magneticFluxInduction', labNumber: 5, enabled: false },
    { ref: 'refractionAndTIR', labNumber: 6, enabled: false },
    { ref: 'mirrors', labNumber: 7, enabled: false },
    { ref: 'lenses', labNumber: 8, enabled: false },
  ],
};
