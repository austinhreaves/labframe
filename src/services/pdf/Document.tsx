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
import type {
  CalculationSection,
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
import { formatDuration } from '@/services/pdf/formatDuration';
import { renderMarkdownToPdf } from '@/services/pdf/markdown/renderMarkdownToPdf';
import { SECTION_TITLES, sectionTitle } from '@/services/pdf/sectionTitle';
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

const styles = StyleSheet.create({
  // Extra bottom padding leaves room for the fixed per-page identity footer.
  page: {
    paddingTop: 24,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 44,
    fontSize: 10,
    lineHeight: 1.35,
    fontFamily: 'DejaVu Sans',
  },
  // A non-pdfHidden instructions block keeps only its leading heading as an
  // answer-group label; procedure steps and Givens callouts are dropped.
  partHeading: { marginTop: 8, marginBottom: 2 },
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
  // Drawings are capped near half a page so about two drawing pages share one
  // PDF page; uploaded photos keep the larger `calcImage` cap.
  drawImage: { maxWidth: 515, maxHeight: 360, objectFit: 'contain', marginTop: 4 },
  drawPage: { marginTop: 6 },
  prompt: { marginBottom: 4 },
  typed: { fontStyle: 'normal', color: '#111' },
  pasteClipboard: { fontStyle: 'italic', color: '#111' },
  pasteAutocomplete: { color: '#3f3f99' },
  note: { marginTop: 2, fontSize: 8, color: '#666' },
  summaryBlock: {
    marginBottom: 12,
    padding: 6,
    borderWidth: 0.5,
    borderColor: '#777',
    backgroundColor: '#f4f4f4',
  },
  summaryTitle: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  recordCellSection: { flex: 2, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  recordHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#777',
    fontWeight: 700,
  },
  recordTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#777',
    fontWeight: 700,
  },
  // Persistent per-page tamper marks (repeat via `fixed` on every page). The
  // faint diagonal sits behind the body; the footer carries the full identity.
  watermarkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 60,
    fontWeight: 700,
    color: '#f0f0f0',
    transform: 'rotate(-45deg)',
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 16,
    fontSize: 7,
    color: '#888',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 3,
  },
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

// The PDF keeps a non-hidden instructions block's leading heading (a short part
// label) but drops its body so procedure steps and Givens callouts do not bloat
// the report. Returns the first ATX heading line when the block *leads* with one,
// otherwise null (the block is body-only and is omitted entirely).
function firstMarkdownHeading(html: string): string | null {
  for (const rawLine of html.split('\n')) {
    const line = rawLine.trim();
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    if (line.length > 0) {
      // Body text before any heading means this block is a procedure step or
      // note, not a labeled part, so it carries no heading to keep.
      return null;
    }
  }
  return null;
}

// Persistent identity marks repeated on every page (`fixed`). A swapped or
// removed page loses these, and the hash/timestamp/name make the document hard
// to replicate or quietly edit. Present on drafts and signed reports alike.
// Returned as plain elements (not a component) so they sit directly in the page
// tree and stay visible to the text-form render tests.
function pageMarks(marks: { diagonal: string; footer: string }): React.ReactNode[] {
  return [
    <View key="watermark" fixed style={styles.watermarkLayer}>
      <Text style={styles.watermarkText}>{marks.diagonal}</Text>
    </View>,
    <Text key="footer" fixed style={styles.footer}>
      {marks.footer}
    </Text>,
  ];
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

// Sections that own student input (and so can be answered/unanswered and carry
// process-record telemetry). `instructions` and `plot` are field-less.
function isFieldOwning(section: Section): boolean {
  return section.kind !== 'instructions' && section.kind !== 'plot';
}

function hasText(field: FieldValue | undefined): boolean {
  return !!field && field.text.trim().length > 0;
}

function isCalculationAnswered(section: CalculationSection, answers: LabAnswers): boolean {
  // Only the student's active mode counts as their answer (the others stay in
  // the envelope but are not drawn).
  const mode = resolveResponseMode(section, answers.responseSelections ?? {});
  if (mode === 'image') {
    return answers.images[calcImageId(section)] !== undefined;
  }
  if (mode === 'draw') {
    const drawing = parseDrawing(answers.fields[drawStorageKey(section.fieldId)]?.text);
    return !!drawing && drawing.pages.some((page) => page.strokes.length > 0);
  }
  return hasText(answers.fields[section.fieldId]);
}

// A field-owning section is answered when it carries any student content:
// non-empty text, an uploaded image, a non-empty drawing page, or a filled cell.
function isSectionAnswered(section: Section, answers: LabAnswers): boolean {
  switch (section.kind) {
    case 'objective':
    case 'measurement':
    case 'concept':
      return hasText(answers.fields[section.fieldId]);
    case 'calculation':
      return isCalculationAnswered(section, answers);
    case 'multiMeasurement':
      return section.rows.some((row) => hasText(answers.fields[row.id]));
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
      // instructions, plot are not field-owning and never classified.
      return true;
  }
}

type SectionActivity = {
  activeMs: number;
  keystrokes: number;
  deletes: number;
  pastes: { clipboard: number; autocomplete: number; ime: number };
};

function emptyActivity(): SectionActivity {
  return { activeMs: 0, keystrokes: 0, deletes: 0, pastes: { clipboard: 0, autocomplete: 0, ime: 0 } };
}

// Sum typing telemetry across a field-owning section's fields. Calculations
// count only their text field: a draw- or image-answered calculation has zero
// typing activity and is reported under "No recorded activity", which is correct.
function sectionActivity(section: Section, answers: LabAnswers): SectionActivity {
  const activity = emptyActivity();
  const addField = (field: FieldValue | undefined): void => {
    if (!field) {
      return;
    }
    activity.activeMs += field.meta.activeMs;
    activity.keystrokes += field.meta.keystrokes;
    activity.deletes += field.meta.deletes;
    for (const paste of field.pastes) {
      activity.pastes[paste.source] += 1;
    }
  };

  switch (section.kind) {
    case 'objective':
    case 'measurement':
    case 'concept':
    case 'calculation':
      addField(answers.fields[section.fieldId]);
      break;
    case 'multiMeasurement':
      section.rows.forEach((row) => addField(answers.fields[row.id]));
      break;
    case 'image':
      addField(answers.fields[section.captionFieldId]);
      break;
    case 'dataTable': {
      const rows = answers.tables[section.tableId] ?? [];
      rows.forEach((row) => Object.values(row).forEach(addField));
      break;
    }
    default:
      // instructions, plot: field-less.
      break;
  }

  return activity;
}

function hasRecordedActivity(activity: SectionActivity): boolean {
  return (
    activity.activeMs > 0 ||
    activity.keystrokes > 0 ||
    activity.pastes.clipboard > 0 ||
    activity.pastes.autocomplete > 0 ||
    activity.pastes.ime > 0
  );
}

function formatPasteCounts(pastes: SectionActivity['pastes']): string {
  return `${pastes.clipboard} / ${pastes.autocomplete} / ${pastes.ime}`;
}

function sectionView(
  section: Section,
  answers: LabAnswers,
  index: number,
  imageData: Record<string, string> = {},
): React.ReactNode {
  if (section.kind === 'instructions') {
    // Keep only the block's leading heading as an answer-group label; the body
    // (procedure steps, Givens callouts, notes) is dropped from the PDF.
    const heading = firstMarkdownHeading(section.html);
    if (!heading) {
      return null;
    }
    return (
      <View key={`section-${index}`} style={styles.partHeading}>
        {renderMarkdownToPdf(heading)}
      </View>
    );
  }

  if (section.kind === 'calculation') {
    // The PDF renders only the student's active mode (text, drawing, or photo);
    // any answer entered in another mode stays in the envelope but is not drawn.
    const mode = resolveResponseMode(section, answers.responseSelections ?? {});
    const header = (
      <>
        <Text style={styles.sectionTitle}>Calculation{pdfPointsSuffix(section.points)}</Text>
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
          {SECTION_TITLES[section.kind]}
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
        <Text style={styles.sectionTitle}>Measurements{pdfPointsSuffix(section.points)}</Text>
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
          Data Table
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

    // An empty plot collapses to a one-line note instead of a blank axes box.
    if (scatterPoints.length === 0) {
      return (
        <View key={`section-${index}`} style={styles.section}>
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

    const plotTitle = mathToInline(section.title ?? `${section.yLabel} vs. ${section.xLabel}`);

    return (
      <View key={`section-${index}`} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {plotTitle}
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
          Image
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

type RecordRow = { index: number; title: string; activity: SectionActivity };

export function LabReportDocument(props: PDFProps) {
  const { lab, answers, course, imageData = {} } = props;
  const totalPoints = sumSectionPoints(lab.sections);

  // Body (P-C): render answered sections fully; collapse every unanswered
  // field-owning section into one block. `pdfHidden` sections (background/theory)
  // are dropped entirely. Instructions and plots are never "unanswerable".
  const unansweredTitles: string[] = [];
  const bodyNodes = lab.sections.map((section, index) => {
    if (section.pdfHidden) {
      return null;
    }
    if (isFieldOwning(section) && !isSectionAnswered(section, answers)) {
      unansweredTitles.push(sectionTitle(section));
      return null;
    }
    return sectionView(section, answers, index, imageData);
  });

  // Process Record (P-D): one dense row per field-owning section with recorded
  // activity, a totals row, and a single "No recorded activity" summary line for
  // the rest. Field-less and `pdfHidden` sections are omitted entirely.
  const recordRows: RecordRow[] = [];
  const noActivityTitles: string[] = [];
  const totals = emptyActivity();
  lab.sections.forEach((section, index) => {
    if (section.pdfHidden || !isFieldOwning(section)) {
      return;
    }
    const activity = sectionActivity(section, answers);
    const title = sectionTitle(section);
    if (hasRecordedActivity(activity)) {
      recordRows.push({ index, title, activity });
      totals.activeMs += activity.activeMs;
      totals.keystrokes += activity.keystrokes;
      totals.deletes += activity.deletes;
      totals.pastes.clipboard += activity.pastes.clipboard;
      totals.pastes.autocomplete += activity.pastes.autocomplete;
      totals.pastes.ime += activity.pastes.ime;
    } else {
      noActivityTitles.push(title);
    }
  });

  const integrityAgreementText =
    answers.integrity.agreementText || resolveIntegrityAgreementText(lab);
  const aiUsage = answers.integrity.aiUsed ? 'Yes' : 'No';
  const aiLinks = answers.integrity.aiSharedLinks?.trim();
  const agreementAcceptedAt = answers.integrity.agreementAcceptedAt;
  const agreementAcceptedLine =
    answers.integrity.agreementAccepted && agreementAcceptedAt > 0
      ? `Agreement accepted: ${new Date(agreementAcceptedAt).toISOString()}`
      : 'Agreement accepted: not recorded';

  // Per-page identity marks. Signed reports carry the signature and signing
  // time; drafts carry a DRAFT stamp (no envelope hash exists yet).
  const studentName = answers.meta.studentName || 'Unknown student';
  const marks =
    props.mode === 'signed'
      ? {
          diagonal: `${studentName} · SIGNED`,
          footer: `${studentName} · signed ${formatSignedAt(props.signedAt)} · ${props.signature.slice(0, 16)}`,
        }
      : {
          diagonal: `${studentName} · DRAFT`,
          footer: `${studentName} · DRAFT - not for submission`,
        };

  return (
    <Document
      title={`${lab.title} Report`}
      author={answers.meta.studentName}
      subject={props.mode === 'draft' ? 'DRAFT - not for submission' : course.title}
      producer="LabFrame"
      creator="LabFrame"
    >
      <Page size="A4" style={styles.page}>
        {pageMarks(marks)}
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
        {pageMarks(marks)}
        {bodyNodes}
        {unansweredTitles.length > 0 ? (
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryTitle}>
              Unanswered sections ({unansweredTitles.length}): {unansweredTitles.join(', ')}
            </Text>
          </View>
        ) : null}
      </Page>
      <Page size="A4" style={styles.page}>
        {pageMarks(marks)}
        <Text style={styles.title}>Process Record</Text>
        <View style={styles.table}>
          <View style={styles.recordHeaderRow}>
            <Text style={styles.recordCellSection}>Section</Text>
            <Text style={styles.tableCell}>Active time</Text>
            <Text style={styles.tableCell}>Keystrokes</Text>
            <Text style={styles.tableCell}>Deletes</Text>
            <Text style={styles.tableCell}>Pastes (clip / auto / IME)</Text>
          </View>
          {recordRows.map(({ index, title, activity }) => (
            <View key={`record-${index}`} style={styles.tableRow}>
              <Text style={styles.recordCellSection}>{title}</Text>
              <Text style={styles.tableCell}>{formatDuration(activity.activeMs)}</Text>
              <Text style={styles.tableCell}>{activity.keystrokes}</Text>
              <Text style={styles.tableCell}>{activity.deletes}</Text>
              <Text style={styles.tableCell}>{formatPasteCounts(activity.pastes)}</Text>
            </View>
          ))}
          <View style={styles.recordTotalRow}>
            <Text style={styles.recordCellSection}>Total</Text>
            <Text style={styles.tableCell}>{formatDuration(totals.activeMs)}</Text>
            <Text style={styles.tableCell}>{totals.keystrokes}</Text>
            <Text style={styles.tableCell}>{totals.deletes}</Text>
            <Text style={styles.tableCell}>{formatPasteCounts(totals.pastes)}</Text>
          </View>
        </View>
        {noActivityTitles.length > 0 ? (
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryTitle}>
              No recorded activity: {noActivityTitles.join(', ')}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
