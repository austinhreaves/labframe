import type { ReactNode } from 'react';

type TabName = 'simulation' | 'worksheet';

type Props = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  simulationSlot: ReactNode;
  worksheet: ReactNode;
};

export function TabsView({ activeTab, onTabChange, simulationSlot, worksheet }: Props) {
  return (
    <div className="tabs-view">
      <div className="tabs">
        <button type="button" onClick={() => onTabChange('simulation')} aria-pressed={activeTab === 'simulation'}>
          Simulation
        </button>
        <button type="button" onClick={() => onTabChange('worksheet')} aria-pressed={activeTab === 'worksheet'}>
          Worksheet
        </button>
      </div>
      <section style={{ display: activeTab === 'simulation' ? 'block' : 'none' }}>{simulationSlot}</section>
      <section style={{ display: activeTab === 'worksheet' ? 'block' : 'none' }}>{worksheet}</section>
    </div>
  );
}
