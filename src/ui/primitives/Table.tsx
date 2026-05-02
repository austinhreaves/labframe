import type { DataTableSection, FieldValue, TableData } from '@/domain/schema';

import { Field } from '@/ui/primitives/Field';

type TableProps = {
  section: DataTableSection;
  data: TableData;
  onCellChange: (rowIndex: number, columnId: string, value: FieldValue) => void;
};

export function Table({ section, data, onCellChange }: TableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Row</th>
            {section.columns.map((column) => {
              const formulaLabel = column.kind === 'derived' ? column.formulaLabel : undefined;
              return (
                <th key={column.id}>
                  <div className="table-column-header">
                    <span>{column.label}</span>
                    {formulaLabel ? (
                      <small className="table-column-formula" aria-label={`${formulaLabel}, derived column`}>
                        {formulaLabel}
                      </small>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`${section.tableId}-${rowIndex}`}>
              <td>{rowIndex + 1}</td>
              {section.columns.map((column) => (
                <td key={column.id}>
                  <Field
                    id={`${section.tableId}-${column.id}-${rowIndex}`}
                    label={`${column.label} row ${rowIndex + 1}`}
                    value={row[column.id]}
                    onChange={(value) => onCellChange(rowIndex, column.id, value)}
                    readOnly={column.kind === 'derived'}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
