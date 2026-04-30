import React from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  Circle,
  Line,
} from '@react-pdf/renderer';

import type { Course, FieldValue, Lab, LabAnswers, PlotSection, Section, TableData } from '@/domain/schema';
import { attributePastes } from '@/services/pdf/attributePastes';

type PDFProps = {
  lab: Lab;
  answers: LabAnswers;
  course: Course;
  signature: string;
  signedAt: number;
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, lineHeight: 1.35 },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 12 },
  section: { marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingBottom: 8 },
  sectionTitle: { fontSize: 12, marginBottom: 6 },
  row: { marginBottom: 4 },
  label: { fontWeight: 700 },
  table: { marginTop: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#777' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tableCell: { flex: 1, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  typed: { fontStyle: 'normal', color: '#111' },
  pasteClipboard: { fontStyle: 'italic', color: '#111' },
  pasteAutocomplete: { color: '#3f3f99' },
  note: { marginTop: 2, fontSize: 8, color: '#666' },
});

function formatSignedAt(signedAt: number): string {
  return new Date(signedAt).toISOString();
}

function parseNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPlotPoints(section: PlotSection, table: TableData): Array<{ x: number; y: number }> {
  return table
    .map((row) => {
      const x = parseNumber(row[section.xCol]?.text ?? '');
      const y = parseNumber(row[section.yCol]?.text ?? '');
      return x === null || y === null ? null : { x, y };
    })
    .filter((point): point is { x: number; y: number } => point !== null);
}

function fieldView(value: FieldValue | undefined): React.ReactNode {
  if (!value) {
    return <Text style={styles.row}>-</Text>;
  }

  const attributed = attributePastes(value.text, value.pastes);
  return (
    <View style={styles.row}>
      <Text>
        {attributed.spans.length === 0 ? (
          <Text style={styles.typed}>-</Text>
        ) : (
          attributed.spans.map((span, index) => (
            <Text
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              style={
                span.kind === 'pasted-clipboard'
                  ? styles.pasteClipboard
                  : span.kind === 'pasted-autocomplete'
                    ? styles.pasteAutocomplete
                    : styles.typed
              }
            >
              {span.text}
            </Text>
          ))
        )}
      </Text>
      {attributed.removedPastes.map((note) => (
        <Text key={`${note.at}-${note.preview}`} style={styles.note}>
          Removed paste {new Date(note.at).toISOString()}: {note.preview}
        </Text>
      ))}
    </View>
  );
}

function processRecordForSection(section: Section, answers: LabAnswers): { activeMs: number; keystrokes: number; pastes: Record<string, number> } {
  const fieldIds: string[] = [];
  if (section.kind === 'objective' || section.kind === 'measurement' || section.kind === 'calculation' || section.kind === 'concept') {
    fieldIds.push(section.fieldId);
  } else if (section.kind === 'multiMeasurement') {
    fieldIds.push(...section.rows.map((row) => row.id));
  } else if (section.kind === 'image') {
    fieldIds.push(section.captionFieldId);
  } else if (section.kind === 'dataTable') {
    const rows = answers.tables[section.tableId] ?? [];
    for (const row of rows) {
      fieldIds.push(...Object.keys(row));
    }
  }

  let activeMs = 0;
  let keystrokes = 0;
  const pastes: Record<string, number> = { clipboard: 0, autocomplete: 0, ime: 0 };

  for (const fieldId of fieldIds) {
    const field = answers.fields[fieldId];
    if (field) {
      activeMs += field.meta.activeMs;
      keystrokes += field.meta.keystrokes;
      for (const paste of field.pastes) {
        pastes[paste.source] = (pastes[paste.source] ?? 0) + 1;
      }
    }
  }

  return { activeMs, keystrokes, pastes };
}

function sectionView(section: Section, answers: LabAnswers, index: number): React.ReactNode {
  if (section.kind === 'instructions') {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text>{section.html.replace(/<[^>]+>/g, '').replace(/#+\s/g, '')}</Text>
      </View>
    );
  }

  if (section.kind === 'objective' || section.kind === 'measurement' || section.kind === 'calculation' || section.kind === 'concept') {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.kind}</Text>
        {fieldView(answers.fields[section.fieldId])}
      </View>
    );
  }

  if (section.kind === 'multiMeasurement') {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        {section.rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.label}>{row.label}: </Text>
            {fieldView(answers.fields[row.id])}
          </View>
        ))}
      </View>
    );
  }

  if (section.kind === 'dataTable') {
    const rows = answers.tables[section.tableId] ?? [];
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>Data Table: {section.tableId}</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {section.columns.map((column) => (
              <Text key={column.id} style={styles.tableCell}>
                {column.label}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={`${section.tableId}-row-${rowIndex}`} style={styles.tableRow}>
              {section.columns.map((column) => (
                <Text key={column.id} style={styles.tableCell}>
                  {row[column.id]?.text ?? ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (section.kind === 'plot') {
    const table = answers.tables[section.sourceTableId] ?? [];
    const points = getPlotPoints(section, table);
    const fit = answers.fits[section.plotId];
    const width = 360;
    const height = 220;
    const pad = 20;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 1;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const mapX = (x: number) => pad + ((x - minX) / rangeX) * (width - pad * 2);
    const mapY = (y: number) => height - pad - ((y - minY) / rangeY) * (height - pad * 2);

    const slope = typeof fit?.parameters?.a === 'number' ? fit.parameters.a : undefined;

    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>Plot: {section.plotId}</Text>
        <Svg width={width} height={height}>
          <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#222" strokeWidth={1} />
          <Line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#222" strokeWidth={1} />
          {points.map((point, pointIndex) => (
            <Circle key={`${section.plotId}-p-${pointIndex}`} cx={mapX(point.x)} cy={mapY(point.y)} r={2} fill="#1f5ad6" />
          ))}
          {slope !== undefined ? (
            <Line
              x1={mapX(minX)}
              y1={mapY(slope * minX)}
              x2={mapX(maxX)}
              y2={mapY(slope * maxX)}
              stroke="#d26c00"
              strokeWidth={1}
            />
          ) : null}
        </Svg>
      </View>
    );
  }

  if (section.kind === 'image') {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>Image: {section.imageId}</Text>
        <Text>Attachment metadata: {answers.images[section.imageId] ? 'included' : 'none'}</Text>
        <Text>Caption:</Text>
        {fieldView(answers.fields[section.captionFieldId])}
      </View>
    );
  }

  return null;
}

export function LabReportDocument({ lab, answers, course, signature, signedAt }: PDFProps) {
  return (
    <Document
      title={`${lab.title} Report`}
      author={answers.meta.studentName}
      subject={course.title}
      producer="LabFrame"
      creator="LabFrame"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{lab.title}</Text>
        <Text style={styles.subtitle}>{course.title}</Text>
        <Text>Student: {answers.meta.studentName}</Text>
        <Text>
          Signed: {formatSignedAt(signedAt)} - {signature.slice(0, 8)}
        </Text>
      </Page>
      <Page size="A4" style={styles.page}>
        {lab.sections.map((section, index) => sectionView(section, answers, index))}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Process Record</Text>
        {lab.sections.map((section, index) => {
          const record = processRecordForSection(section, answers);
          return (
            <View key={`process-${index}`} style={styles.section}>
              <Text style={styles.sectionTitle}>
                Section {index + 1}: {section.kind}
              </Text>
              <Text>Active time (ms): {record.activeMs}</Text>
              <Text>Keystrokes: {record.keystrokes}</Text>
              <Text>Pastes clipboard: {record.pastes.clipboard ?? 0}</Text>
              <Text>Pastes autocomplete: {record.pastes.autocomplete ?? 0}</Text>
              <Text>Pastes IME: {record.pastes.ime ?? 0}</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
