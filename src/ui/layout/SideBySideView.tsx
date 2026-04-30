import type { ReactNode } from 'react';

type Props = {
  simulationSlot: ReactNode;
  worksheet: ReactNode;
};

export function SideBySideView({ simulationSlot, worksheet }: Props) {
  return (
    <div className="lab-layout-side">
      <section>{simulationSlot}</section>
      <section>{worksheet}</section>
    </div>
  );
}
