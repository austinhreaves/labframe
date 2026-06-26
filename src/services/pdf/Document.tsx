import {
  Document,
  Image,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  Circle,
  Line,
} from '@react-pdf/renderer';

import { formatPointsLabel, sumSectionPoints } from '@/domain/pointsFormatting';
import { formatDuration } from '@/services/pdf/formatDuration';
import type {
  Course,
  FieldValue,
  Lab,
  LabAnswers,
  PlotSection,
  Section,
  TableData,
} from '@/domain/schema';
import { resolveIntegrityAgreementText } from '@/services/integrity/agreementText';
import { attributePastes } from '@/services/pdf/attributePastes';
import { computeClippedFitLineInPdfSvg } from '@/services/pdf/fitLine';
import { renderMarkdownToPdf } from '@/services/pdf/markdown/renderMarkdownToPdf';
import {
  calcImageId,
  drawPageKey,
  drawStorageKey,
  resolveResponseMode,
} from '@/domain/calculationResponse';
import { parseDrawing } from '@/ui/primitives/drawStrokes';
import { mathToInline } from '@/services/pdf/markdown/latexToUnicode';

type PDFProps = {
  lab: Lab;
  answers: LabAnswers;
  course: Course;
  /**
   * Image bytes as data URLs keyed by image id, collected at export time from
   * the runtime store. Kept separate from `answers` so the signed envelope
   * stays byte-stable (it binds images by SHA-256, not by their pixels).
   */
  imageData?: Record<string, string> | undefined;
} & ({ mode: 'signed'; signature: string; signedAt: number } | { mode: 'draft' });

const FIELD_OWNING_KINDS: ReadonlySet<Section['kind']> = new Set([
  'objective',
  'measurement',
  'multiMeasurement',
  'calculation',
  'concept',
  'image',
  'dataTable',
]);

/** True for sections that hold a student answer (not instructions or plots). */
function isFieldOwning(section: Section): boolean {
  return FIELD_OWNING_KINDS.has(section.kind);
}

function hasText(field: FieldValue | undefined): boolean {
  return field !== undefined && field.text.trim().length > 0;
}

/**
 * Whether a field-owning section has any student input: typed text, an uploaded
 * image, a non-empty drawing, or a filled table cell (P-C). Non-field sections
 * return false (they are never classified as answered/unanswered).
 */
function isSectionAnswered(section: Section, answers: LabAnswers): boolean {
  switch (section.kind) {
    case 'objective':
    case 'measurement':
    case 'concept':
      return hasText(answers.fields[section.fieldId]);
    case 'multiMeasurement':
      return section.rows.some((row) => hasText(answers.fields[row.id]));
    case 'calculation': {
      if (hasText(answers.fields[section.fieldId])) {
        return true;
      }
      if (answers.images[calcImageId(section)]) {
        return true;
      }
      const drawing = parseDrawing(answers.fields[drawStorageKey(section.fieldId)]?.text);
      return drawing !== null && drawing.pages.some((page) => page.strokes.length > 0);
    }
    case 'image':
      return (
        answers.images[section.imageId] !== undefined ||
        hasText(answers.fields[section.captionFieldId])
      );
    case 'dataTable': {
      const rows = answers.tables[section.tableId] ?? [];
      return rows.some((row) => Object.values(row).some((cell) => hasText(cell)));
    }
    default:
      return false;
  }
}

/**
 * Human title for a section, shared by the PDF body headings, the unanswered
 * compaction list, and the Process Record (P-B / P-D). Points suffixes are
 * appended by callers, not here.
 */
function sectionTitle(section: Section): string {
  switch (section.kind) {
    case 'instructions': {
      const heading = section.html.match(/^\s*#{1,3}\s+(.+?)\s*$/m);
      const title = heading?.[1]?.trim();
      return title && title.length > 0 ? title : 'Instructions';
    }
    case 'objective':
      return 'Objective';
    case 'measurement':
      return 'Measurement';
    case 'multiMeasurement':
      return 'Measurements';
    case 'calculation':
      return 'Calculation';
    case 'concept':
      return 'Response';
    case 'dataTable':
      return 'Data Table';
    case 'image':
      return 'Image';
    case 'plot':
      return mathToInline(section.title ?? `${section.yLabel} vs. ${section.xLabel}`);
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, lineHeight: 1.35, fontFamily: 'DejaVu Sans' },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 12 },
  section: {
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 12, marginBottom: 6 },
  row: { marginBottom: 4 },
  label: { fontWeight: 700 },
  table: { marginTop: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#777' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tableCell: { flex: 1, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  tableHeaderStack: { flexDirection: 'column' },
  tableFormulaLabel: { fontSize: 8, color: '#555' },
  calcImage: { maxWidth: 515, maxHeight: 700, objectFit: 'contain', marginTop: 4 },
  // Drawings are capped near half a page so two drawing pages fit per PDF page
  // (P-E). Uploaded photos keep the larger calcImage cap.
  drawImage: { maxWidth: 515, maxHeight: 380, objectFit: 'contain', marginTop: 4 },
  drawPage: { marginTop: 6 },
  prompt: { marginBottom: 4 },
  typed: { fontStyle: 'normal', color: '#111' },
  pasteClipboard: { fontStyle: 'italic', color: '#111' },
  pasteAutocomplete: { color: '#3f3f99' },
  note: { marginTop: 2, fontSize: 8, color: '#666' },
  // Compaction block listing unanswered field-owning sections (P-C).
  compactBlock: { marginTop: 6, marginBottom: 6 },
  // Dense Process Record table (P-D).
  prTable: { marginTop: 8, borderWidth: 0.5, borderColor: '#777' },
  prRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  prTotalsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#777' },
  prCell: { flex: 1, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  prCellWide: { flex: 2, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  prHeaderText: { fontWeight: 700 },
});

function formatSignedAt(signedAt: number): string {
  return new Date(signedAt).toISOString();
}

function pdfPointsSuffix(points: number | undefined): string {
  if (points === undefined) {
    return '';
  }
  return ` (${formatPointsLabel(points)} pts)`;
}

// Render a section prompt (markdown, may contain inline math) above its answer.
function promptBlock(markdown: string | undefined): React.ReactNode {
  if (!markdown || !markdown.trim()) {
    return null;
  }
  return <View style={styles.prompt}>{renderMarkdownToPdf(markdown)}</View>;
}

function attachmentCaption(
  noun: string,
  blobRef: { bytes: number; sha256?: string | undefined } | undefined,
): string {
  if (!blobRef) {
    return `No ${noun} attached`;
  }
  const sha = blobRef.sha256 ? ` · SHA-256: ${blobRef.sha256.slice(0, 16)}…` : '';
  return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} attached: ${blobRef.bytes} bytes${sha}`;
}

function imageCaption(blobRef: { bytes: number; sha256?: string | undefined } | undefined): string {
  return attachmentCaption('image', blobRef);
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

function fieldView(value: FieldValue | undefined): JSX.Element {
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
              key={`${span.kind}-${span.text}-${index}`}
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

type PasteCounts = { clipboard: number; autocomplete: number; ime: number };

type ProcessRecord = {
  activeMs: number;
  keystrokes: number;
  deletes: number;
  pastes: PasteCounts;
};

function emptyProcessRecord(): ProcessRecord {
  return {
    activeMs: 0,
    keystrokes: 0,
    deletes: 0,
    pastes: { clipboard: 0, autocomplete: 0, ime: 0 },
  };
}

function processRecordForSection(section: Section, answers: LabAnswers): ProcessRecord {
  const fieldIds: string[] = [];

  switch (section.kind) {
    case 'objective':
    case 'measurement':
    case 'calculation':
    case 'concept':
      fieldIds.push(section.fieldId);
      break;
    case 'multiMeasurement':
      fieldIds.push(...section.rows.map((row) => row.id));
      break;
    case 'image':
      fieldIds.push(section.captionFieldId);
      break;
    case 'dataTable': {
      const rows = answers.tables[section.tableId] ?? [];
      for (const row of rows) {
        fieldIds.push(...Object.keys(row));
      }
      break;
    }
    case 'instructions':
      // Instructions sections own no fields, so process record is intentionally empty.
      return emptyProcessRecord();
    case 'plot':
      // Plot sections also own no fields directly, so process record is intentionally empty.
      return emptyProcessRecord();
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }

  let activeMs = 0;
  let keystrokes = 0;
  let deletes = 0;
  const pastes: PasteCounts = { clipboard: 0, autocomplete: 0, ime: 0 };

  for (const fieldId of fieldIds) {
    const field = answers.fields[fieldId];
    if (field) {
      activeMs += field.meta.activeMs;
      keystrokes += field.meta.keystrokes;
      deletes += field.meta.deletes;
      for (const paste of field.pastes) {
        pastes[paste.source] += 1;
      }
    }
  }

  return { activeMs, keystrokes, deletes, pastes };
}

function totalPastes(pastes: PasteCounts): number {
  return pastes.clipboard + pastes.autocomplete + pastes.ime;
}

function formatPastes(pastes: PasteCounts): string {
  return `${pastes.clipboard} / ${pastes.autocomplete} / ${pastes.ime}`;
}

function hasRecordedActivity(record: ProcessRecord): boolean {
  return record.activeMs > 0 || record.keystrokes > 0 || totalPastes(record.pastes) > 0;
}

function sectionView(
  section: Section,
  answers: LabAnswers,
  index: number,
  imageData: Record<string, string> = {},
): React.ReactNode {
  if (section.kind === 'instructions') {
    // No generic "Instructions" heading: the markdown carries its own headings.
    return (
      <View key={`section-${index}`} style={styles.section}>
        {section.points !== undefined ? (
          <Text style={styles.note}>{formatPointsLabel(section.points)} pts</Text>
        ) : null}
        <View>{renderMarkdownToPdf(section.html)}</View>
      </View>
    );
  }

  if (section.kind === 'calculation') {
    // The PDF renders only the student's active mode (text, drawing, or photo);
    // any answer entered in another mode stays in the envelope but is not drawn.
    const mode = resolveResponseMode(section, answers.responseSelections ?? {});
    const header = (
      <>
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        {promptBlock(section.prompt)}
      </>
    );
    if (mode === 'image') {
      const imageId = calcImageId(section);
      return (
        <View key={`section-${index}`} style={styles.section}>
          {header}
          {imageData[imageId] ? <Image src={imageData[imageId]} style={styles.calcImage} /> : null}
          <Text style={styles.note}>{imageCaption(answers.images[imageId])}</Text>
        </View>
      );
    }
    if (mode === 'draw') {
      const drawing = parseDrawing(answers.fields[drawStorageKey(section.fieldId)]?.text);
      // One image block per page that rasterized (non-empty); each page is kept
      // whole (wrap=false) but pages flow so the section paginates.
      const pageKeys = Array.from({ length: drawing?.pages.length ?? 0 }, (_, i) =>
        drawPageKey(section.fieldId, i + 1),
      ).filter((key) => imageData[key]);
      return (
        <View key={`section-${index}`} style={styles.section}>
          {header}
          {pageKeys.length === 0 ? (
            <Text style={styles.note}>{attachmentCaption('drawing', undefined)}</Text>
          ) : (
            pageKeys.map((key, pageIndex) => (
              <View key={key} style={styles.drawPage} wrap={false}>
                {pageKeys.length > 1 ? (
                  <Text style={styles.note}>
                    Page {pageIndex + 1} of {pageKeys.length}
                  </Text>
                ) : null}
                <Image src={imageData[key]} style={styles.drawImage} />
                <Text style={styles.note}>{attachmentCaption('drawing', answers.images[key])}</Text>
              </View>
            ))
          )}
        </View>
      );
    }
    return (
      <View key={`section-${index}`} style={styles.section}>
        {header}
        {fieldView(answers.fields[section.fieldId])}
      </View>
    );
  }

  if (
    section.kind === 'objective' ||
    section.kind === 'measurement' ||
    section.kind === 'concept'
  ) {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        {section.kind === 'objective' ? promptBlock(section.prompt) : null}
        {section.kind === 'concept' ? (
          <>
            {promptBlock(section.preamble)}
            {promptBlock(section.prompt)}
          </>
        ) : null}
        {section.kind === 'measurement' ? (
          <Text style={styles.label}>
            {mathToInline(section.label)}
            {section.unit ? ` (${section.unit})` : ''}
          </Text>
        ) : null}
        {fieldView(answers.fields[section.fieldId])}
      </View>
    );
  }

  if (section.kind === 'multiMeasurement') {
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        {section.rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.label}>{mathToInline(row.label)}: </Text>
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
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {section.columns.map((column) => {
              const formulaLabel = column.kind === 'derived' ? column.formulaLabel : undefined;
              return (
                <View key={column.id} style={styles.tableCell}>
                  <View style={styles.tableHeaderStack}>
                    <Text>{mathToInline(column.label)}</Text>
                    {formulaLabel ? (
                      <Text style={styles.tableFormulaLabel}>{mathToInline(formulaLabel)}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
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
    const scatterPoints = getPlotPoints(section, table);

    // P-E: an empty plot collapses to a one-line placeholder instead of a blank
    // axes box.
    if (scatterPoints.length === 0) {
      return (
        <View key={`section-${index}`} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {sectionTitle(section)}
            {pdfPointsSuffix(section.points)}
          </Text>
          <Text style={styles.note}>{sectionTitle(section)}: no data plotted</Text>
        </View>
      );
    }

    const fit = answers.fits[section.plotId];
    const width = 360;
    const height = 220;
    const pad = 20;
    const xs = scatterPoints.map((point) => point.x);
    const ys = scatterPoints.map((point) => point.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 1;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const mapX = (x: number) => pad + ((x - minX) / rangeX) * (width - pad * 2);
    const mapY = (y: number) => height - pad - ((y - minY) / rangeY) * (height - pad * 2);

    const a = typeof fit?.parameters?.a === 'number' ? fit.parameters.a : undefined;
    const b = typeof fit?.parameters?.b === 'number' ? fit.parameters.b : 0;
    const fitLine =
      a === undefined
        ? null
        : computeClippedFitLineInPdfSvg({
            minX,
            maxX,
            a,
            b,
            mapX,
            mapY,
            plotBounds: {
              minX: pad,
              maxX: width - pad,
              minY: pad,
              maxY: height - pad,
            },
          });

    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        <Svg width={width} height={height}>
          <Line
            x1={pad}
            y1={height - pad}
            x2={width - pad}
            y2={height - pad}
            stroke="#222"
            strokeWidth={1}
          />
          <Line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#222" strokeWidth={1} />
          {scatterPoints.map((point, pointIndex) => (
            <Circle
              key={`${section.plotId}-p-${pointIndex}`}
              cx={mapX(point.x)}
              cy={mapY(point.y)}
              r={2}
              fill="#1f5ad6"
            />
          ))}
          {fitLine ? (
            <Line
              x1={fitLine.x1}
              y1={fitLine.y1}
              x2={fitLine.x2}
              y2={fitLine.y2}
              stroke="#d26c00"
              strokeWidth={1}
            />
          ) : null}
        </Svg>
      </View>
    );
  }

  if (section.kind === 'image') {
    const blobRef = answers.images[section.imageId];
    const src = imageData[section.imageId];
    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {sectionTitle(section)}
          {pdfPointsSuffix(section.points)}
        </Text>
        {src ? <Image src={src} style={styles.calcImage} /> : null}
        <Text style={styles.note}>{imageCaption(blobRef)}</Text>
        <Text>Caption:</Text>
        {fieldView(answers.fields[section.captionFieldId])}
      </View>
    );
  }

  return null;
}

export function LabReportDocument(props: PDFProps) {
  const { lab, answers, course, imageData = {} } = props;
  const totalPoints = sumSectionPoints(lab.sections);
  const integrityAgreementText =
    answers.integrity.agreementText || resolveIntegrityAgreementText(lab);
  const aiUsage = answers.integrity.aiUsed ? 'Yes' : 'No';
  const aiLinks = answers.integrity.aiSharedLinks?.trim();
  const agreementAcceptedAt = answers.integrity.agreementAcceptedAt;
  const agreementAcceptedLine =
    answers.integrity.agreementAccepted && agreementAcceptedAt > 0
      ? `Agreement accepted: ${new Date(agreementAcceptedAt).toISOString()}`
      : 'Agreement accepted: not recorded';

  // pdfHidden sections are dropped from the body and the Process Record entirely
  // (P-C). They still render on screen and never touch the signed envelope.
  const visibleSections = lab.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.pdfHidden !== true);

  // Body (P-C): answered field-owning sections render in full; instructions and
  // plots always render; unanswered field-owning sections collapse into one
  // block instead of repeating empty prompts.
  const bodyNodes: React.ReactNode[] = [];
  const unansweredTitles: string[] = [];
  for (const { section, index } of visibleSections) {
    if (isFieldOwning(section) && !isSectionAnswered(section, answers)) {
      unansweredTitles.push(sectionTitle(section));
      continue;
    }
    bodyNodes.push(sectionView(section, answers, index, imageData));
  }

  // Process Record (P-D): one dense row per field-owning section with recorded
  // activity, plus a totals row; zero-activity sections collapse to one line.
  const totals = emptyProcessRecord();
  const activeRecords: Array<{ title: string; record: ProcessRecord }> = [];
  const noActivityTitles: string[] = [];
  for (const { section } of visibleSections) {
    if (!isFieldOwning(section)) {
      continue;
    }
    const record = processRecordForSection(section, answers);
    if (!hasRecordedActivity(record)) {
      noActivityTitles.push(sectionTitle(section));
      continue;
    }
    activeRecords.push({ title: sectionTitle(section), record });
    totals.activeMs += record.activeMs;
    totals.keystrokes += record.keystrokes;
    totals.deletes += record.deletes;
    totals.pastes.clipboard += record.pastes.clipboard;
    totals.pastes.autocomplete += record.pastes.autocomplete;
    totals.pastes.ime += record.pastes.ime;
  }

  return (
    <Document
      title={`${lab.title} Report`}
      author={answers.meta.studentName}
      subject={props.mode === 'draft' ? 'DRAFT - not for submission' : course.title}
      producer="LabFrame"
      creator="LabFrame"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{lab.title}</Text>
        <Text style={styles.subtitle}>{course.title}</Text>
        {totalPoints > 0 ? (
          <Text style={styles.subtitle}>Total: {formatPointsLabel(totalPoints)} points</Text>
        ) : null}
        <Text>Student: {answers.meta.studentName}</Text>
        {props.mode === 'signed' ? (
          <Text>
            Signed: {formatSignedAt(props.signedAt)} - {props.signature.slice(0, 8)}
          </Text>
        ) : (
          <Text>DRAFT - unsigned export (not for submission)</Text>
        )}
        <Text style={styles.row}>Integrity statement: {integrityAgreementText}</Text>
        <Text style={styles.row}>{agreementAcceptedLine}</Text>
        <Text style={styles.row}>AI/LLM tools used: {aiUsage}</Text>
        {aiLinks ? <Text style={styles.row}>AI shared links: {aiLinks}</Text> : null}
      </Page>
      <Page size="A4" style={styles.page}>
        {bodyNodes}
        {unansweredTitles.length > 0 ? (
          <View style={styles.compactBlock}>
            <Text style={styles.sectionTitle}>Unanswered sections ({unansweredTitles.length})</Text>
            <Text>{unansweredTitles.join(', ')}</Text>
          </View>
        ) : null}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Process Record</Text>
        {activeRecords.length > 0 ? (
          <View style={styles.prTable}>
            <View style={styles.prRow}>
              <Text style={[styles.prCellWide, styles.prHeaderText]}>Section</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>Active time</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>Keystrokes</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>Deletes</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>Pastes (c / a / i)</Text>
            </View>
            {activeRecords.map(({ title, record }, recordIndex) => (
              <View key={`pr-${recordIndex}`} style={styles.prRow}>
                <Text style={styles.prCellWide}>{title}</Text>
                <Text style={styles.prCell}>{formatDuration(record.activeMs)}</Text>
                <Text style={styles.prCell}>{record.keystrokes}</Text>
                <Text style={styles.prCell}>{record.deletes}</Text>
                <Text style={styles.prCell}>{formatPastes(record.pastes)}</Text>
              </View>
            ))}
            <View style={styles.prTotalsRow}>
              <Text style={[styles.prCellWide, styles.prHeaderText]}>Total</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>
                {formatDuration(totals.activeMs)}
              </Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>{totals.keystrokes}</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>{totals.deletes}</Text>
              <Text style={[styles.prCell, styles.prHeaderText]}>
                {formatPastes(totals.pastes)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.note}>No recorded activity on any section.</Text>
        )}
        {noActivityTitles.length > 0 ? (
          <Text style={styles.note}>No recorded activity: {noActivityTitles.join(', ')}</Text>
        ) : null}
      </Page>
    </Document>
  );
}
