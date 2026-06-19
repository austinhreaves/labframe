import type { ReactNode } from 'react';

import type { LabDocSection } from '@/domain/schema';
import { Button } from '@/ui/primitives/Button';
import { genId } from '@/ui/author/draftModel';

type SectionOf<K extends LabDocSection['kind']> = Extract<LabDocSection, { kind: K }>;

export type TableRef = {
  tableId: string;
  label: string;
  columns: { id: string; label: string }[];
};

type EditorProps = {
  section: LabDocSection;
  onChange: (next: LabDocSection) => void;
  tables: TableRef[];
  onInsertFigure: () => void;
};

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="author-field">
      <span className="author-field-label">{label}</span>
      {children}
    </label>
  );
}

function optionalNumber(value: string): number | undefined {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function InstructionsEditor({
  section,
  onChange,
  onInsertFigure,
}: {
  section: SectionOf<'instructions'>;
  onChange: (next: LabDocSection) => void;
  onInsertFigure: () => void;
}) {
  return (
    <>
      <Labeled label="Markdown (supports headings, lists, math, and figures)">
        <textarea
          className="author-textarea"
          rows={6}
          value={section.html}
          onChange={(e) => onChange({ ...section, html: e.currentTarget.value })}
        />
      </Labeled>
      <Button variant="ghost" size="sm" onClick={onInsertFigure}>
        Insert figure
      </Button>
    </>
  );
}

function ObjectiveEditor({
  section,
  onChange,
}: {
  section: SectionOf<'objective'>;
  onChange: (next: LabDocSection) => void;
}) {
  return (
    <Labeled label="Prompt">
      <textarea
        className="author-textarea"
        rows={2}
        value={section.prompt ?? ''}
        onChange={(e) => onChange({ ...section, prompt: e.currentTarget.value })}
      />
    </Labeled>
  );
}

function MeasurementEditor({
  section,
  onChange,
}: {
  section: SectionOf<'measurement'>;
  onChange: (next: LabDocSection) => void;
}) {
  return (
    <>
      <Labeled label="Label">
        <input
          className="author-input"
          value={section.label}
          onChange={(e) => onChange({ ...section, label: e.currentTarget.value })}
        />
      </Labeled>
      <Labeled label="Unit (optional)">
        <input
          className="author-input"
          value={section.unit ?? ''}
          onChange={(e) => {
            const unit = e.currentTarget.value.trim();
            const next = { ...section };
            if (unit) next.unit = unit;
            else delete next.unit;
            onChange(next);
          }}
        />
      </Labeled>
    </>
  );
}

function MultiMeasurementEditor({
  section,
  onChange,
}: {
  section: SectionOf<'multiMeasurement'>;
  onChange: (next: LabDocSection) => void;
}) {
  const setRow = (index: number, patch: Partial<{ label: string; unit?: string }>) => {
    const rows = section.rows.map((row, i) => {
      if (i !== index) return row;
      const nextRow = { ...row, ...patch };
      if ('unit' in patch && !patch.unit) delete nextRow.unit;
      return nextRow;
    });
    onChange({ ...section, rows });
  };
  return (
    <>
      {section.rows.map((row, index) => (
        <div className="author-row" key={row.id}>
          <input
            className="author-input"
            placeholder="Label"
            value={row.label}
            onChange={(e) => setRow(index, { label: e.currentTarget.value })}
          />
          <input
            className="author-input author-input-narrow"
            placeholder="Unit"
            value={row.unit ?? ''}
            onChange={(e) => setRow(index, { unit: e.currentTarget.value.trim() })}
          />
          <button
            type="button"
            className="author-remove"
            disabled={section.rows.length <= 1}
            onClick={() =>
              onChange({ ...section, rows: section.rows.filter((_, i) => i !== index) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            ...section,
            rows: [...section.rows, { id: genId('row'), label: `Row ${section.rows.length + 1}` }],
          })
        }
      >
        Add row
      </Button>
    </>
  );
}

function DataTableEditor({
  section,
  onChange,
}: {
  section: SectionOf<'dataTable'>;
  onChange: (next: LabDocSection) => void;
}) {
  const setColumn = (index: number, patch: Partial<{ label: string; unit?: string }>) => {
    const columns = section.columns.map((col, i) => {
      if (i !== index) return col;
      const nextCol = { ...col, ...patch };
      if ('unit' in patch && !patch.unit) delete nextCol.unit;
      return nextCol;
    });
    onChange({ ...section, columns });
  };
  return (
    <>
      <Labeled label="Number of rows">
        <input
          className="author-input author-input-narrow"
          type="number"
          min={1}
          value={section.rowCount}
          onChange={(e) =>
            onChange({
              ...section,
              rowCount: Math.max(1, Number.parseInt(e.currentTarget.value, 10) || 1),
            })
          }
        />
      </Labeled>
      <span className="author-field-label">Columns (students type the values)</span>
      {section.columns.map((col, index) => (
        <div className="author-row" key={col.id}>
          <input
            className="author-input"
            placeholder="Column label"
            value={col.label}
            onChange={(e) => setColumn(index, { label: e.currentTarget.value })}
          />
          <input
            className="author-input author-input-narrow"
            placeholder="Unit"
            value={col.unit ?? ''}
            onChange={(e) => setColumn(index, { unit: e.currentTarget.value.trim() })}
          />
          <button
            type="button"
            className="author-remove"
            disabled={section.columns.length <= 1}
            onClick={() =>
              onChange({ ...section, columns: section.columns.filter((_, i) => i !== index) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            ...section,
            columns: [
              ...section.columns,
              { id: genId('col'), label: `Column ${section.columns.length + 1}`, kind: 'input' },
            ],
          })
        }
      >
        Add column
      </Button>
    </>
  );
}

function PlotEditor({
  section,
  onChange,
  tables,
}: {
  section: SectionOf<'plot'>;
  onChange: (next: LabDocSection) => void;
  tables: TableRef[];
}) {
  const selectedTable = tables.find((t) => t.tableId === section.sourceTableId);
  const columns = selectedTable?.columns ?? [];
  return (
    <>
      <Labeled label="Source data table">
        <select
          className="author-input"
          value={section.sourceTableId}
          onChange={(e) =>
            onChange({ ...section, sourceTableId: e.currentTarget.value, xCol: '', yCol: '' })
          }
        >
          <option value="">Select a table…</option>
          {tables.map((t) => (
            <option key={t.tableId} value={t.tableId}>
              {t.label}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="X column">
        <select
          className="author-input"
          value={section.xCol}
          disabled={columns.length === 0}
          onChange={(e) => onChange({ ...section, xCol: e.currentTarget.value })}
        >
          <option value="">Select…</option>
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="Y column">
        <select
          className="author-input"
          value={section.yCol}
          disabled={columns.length === 0}
          onChange={(e) => onChange({ ...section, yCol: e.currentTarget.value })}
        >
          <option value="">Select…</option>
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="X axis label">
        <input
          className="author-input"
          value={section.xLabel}
          onChange={(e) => onChange({ ...section, xLabel: e.currentTarget.value })}
        />
      </Labeled>
      <Labeled label="Y axis label">
        <input
          className="author-input"
          value={section.yLabel}
          onChange={(e) => onChange({ ...section, yLabel: e.currentTarget.value })}
        />
      </Labeled>
    </>
  );
}

function ImageEditor({
  section,
  onChange,
}: {
  section: SectionOf<'image'>;
  onChange: (next: LabDocSection) => void;
}) {
  return (
    <Labeled label="Max upload size (MB, optional)">
      <input
        className="author-input author-input-narrow"
        type="number"
        min={1}
        value={section.maxMB ?? ''}
        onChange={(e) => {
          const next = { ...section };
          const mb = optionalNumber(e.currentTarget.value);
          if (mb) next.maxMB = mb;
          else delete next.maxMB;
          onChange(next);
        }}
      />
    </Labeled>
  );
}

function CalculationEditor({
  section,
  onChange,
}: {
  section: SectionOf<'calculation'>;
  onChange: (next: LabDocSection) => void;
}) {
  return (
    <>
      <Labeled label="Prompt">
        <textarea
          className="author-textarea"
          rows={2}
          value={section.prompt}
          onChange={(e) => onChange({ ...section, prompt: e.currentTarget.value })}
        />
      </Labeled>
      <label className="author-checkbox">
        <input
          type="checkbox"
          checked={section.equationEditor ?? false}
          onChange={(e) => {
            const next = { ...section };
            if (e.currentTarget.checked) next.equationEditor = true;
            else delete next.equationEditor;
            onChange(next);
          }}
        />
        Show the equation editor
      </label>
    </>
  );
}

function ConceptEditor({
  section,
  onChange,
}: {
  section: SectionOf<'concept'>;
  onChange: (next: LabDocSection) => void;
}) {
  return (
    <>
      <Labeled label="Preamble (optional markdown shown above the response)">
        <textarea
          className="author-textarea"
          rows={2}
          value={section.preamble ?? ''}
          onChange={(e) => {
            const next = { ...section };
            const preamble = e.currentTarget.value;
            if (preamble) next.preamble = preamble;
            else delete next.preamble;
            onChange(next);
          }}
        />
      </Labeled>
      <Labeled label="Prompt">
        <textarea
          className="author-textarea"
          rows={2}
          value={section.prompt}
          onChange={(e) => onChange({ ...section, prompt: e.currentTarget.value })}
        />
      </Labeled>
    </>
  );
}

export function SectionEditor({ section, onChange, tables, onInsertFigure }: EditorProps) {
  switch (section.kind) {
    case 'instructions':
      return (
        <InstructionsEditor section={section} onChange={onChange} onInsertFigure={onInsertFigure} />
      );
    case 'objective':
      return <ObjectiveEditor section={section} onChange={onChange} />;
    case 'measurement':
      return <MeasurementEditor section={section} onChange={onChange} />;
    case 'multiMeasurement':
      return <MultiMeasurementEditor section={section} onChange={onChange} />;
    case 'dataTable':
      return <DataTableEditor section={section} onChange={onChange} />;
    case 'plot':
      return <PlotEditor section={section} onChange={onChange} tables={tables} />;
    case 'image':
      return <ImageEditor section={section} onChange={onChange} />;
    case 'calculation':
      return <CalculationEditor section={section} onChange={onChange} />;
    case 'concept':
      return <ConceptEditor section={section} onChange={onChange} />;
  }
}
