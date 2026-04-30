import type { DataTableSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Table } from '@/ui/primitives/Table';

type Props = {
  section: DataTableSection;
};

export function DataTableSectionView({ section }: Props) {
  const table = useLabStore((state) => state.tables[section.tableId] ?? []);
  const setTableCell = useLabStore((state) => state.setTableCell);

  return (
    <section className="section">
      <Table
        section={section}
        data={table}
        onCellChange={(rowIndex, columnId, value) => setTableCell(section.tableId, rowIndex, columnId, value)}
      />
    </section>
  );
}
