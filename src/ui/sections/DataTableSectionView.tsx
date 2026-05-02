import type { DataTableSection, TableData } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { Table } from '@/ui/primitives/Table';

const EMPTY_TABLE: TableData = [];

type Props = {
  section: DataTableSection;
};

export function DataTableSectionView({ section }: Props) {
  const table = useLabStore((state) => state.tables[section.tableId] ?? EMPTY_TABLE);
  const tableData: TableData = table.length === 0 ? EMPTY_TABLE : [...table];
  const setTableCell = useLabStore((state) => state.setTableCell);

  return (
    <section className="section">
      <Table
        section={section}
        data={tableData}
        onCellChange={(rowIndex, columnId, value) => setTableCell(section.tableId, rowIndex, columnId, value)}
      />
    </section>
  );
}