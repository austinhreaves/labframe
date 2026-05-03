/**
 * Paste attribution for PDF output: map paste telemetry onto the final field text
 * by normalizing both sides and using literal substring matching only — no edit
 * distance, LCS, or similarity ratio.
 *
 * Rationale: false negatives (an edited paste loses inline italics/underline) are
 * acceptable because the Process Record still lists the paste; false positives
 * (typed prose marked as pasted) are not. Heuristic matchers risk the latter on
 * short strings (e.g. "1.33" appearing incidentally in a sentence).
 *
 * Rejected alternatives: Levenshtein / LCS-style recovery — higher recall but
 * meaningful false-positive risk. Upgrading the matcher requires revisiting these
 * tradeoffs and updating tests in tests/unit/attributePastes.test.ts.
 */
import type { PasteEvent } from '@/domain/schema';

export type SpanKind = 'typed' | 'pasted-clipboard' | 'pasted-autocomplete';

export type Span = {
  text: string;
  kind: SpanKind;
};

export type RemovedPasteNote = {
  at: number;
  preview: string;
  source: PasteEvent['source'];
};

const SOFT_CHAR_RE = /[\s.,;:!?'"`~\-_()[\]{}\\/|<>+=*]/;

type Normalized = {
  value: string;
  indexMap: number[];
};

function isSoftChar(char: string): boolean {
  return SOFT_CHAR_RE.test(char);
}

function normalizeForMatch(value: string): Normalized {
  const out: string[] = [];
  const indexMap: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const char = value.charAt(i);
    if (isSoftChar(char)) {
      continue;
    }
    out.push(char.toLowerCase());
    indexMap.push(i);
  }
  return {
    value: out.join(''),
    indexMap,
  };
}

function toPreview(value: string): string {
  return value.length <= 60 ? value : `${value.slice(0, 60)}...`;
}

export function attributePastes(
  text: string,
  pastes: PasteEvent[],
): { spans: Span[]; removedPastes: RemovedPasteNote[] } {
  if (!text) {
    return {
      spans: [],
      removedPastes: pastes.map((paste) => ({ at: paste.at, preview: toPreview(paste.text), source: paste.source })),
    };
  }

  const marks: SpanKind[] = Array.from({ length: text.length }, () => 'typed');
  const normalizedText = normalizeForMatch(text);
  const removedPastes: RemovedPasteNote[] = [];
  let searchFrom = 0;

  for (const paste of pastes) {
    if (paste.source === 'ime') {
      continue;
    }
    const normalizedPaste = normalizeForMatch(paste.text);
    if (!normalizedPaste.value) {
      removedPastes.push({ at: paste.at, preview: toPreview(paste.text), source: paste.source });
      continue;
    }
    const normalizedIndex = normalizedText.value.indexOf(normalizedPaste.value, searchFrom);
    if (normalizedIndex < 0) {
      removedPastes.push({ at: paste.at, preview: toPreview(paste.text), source: paste.source });
      continue;
    }

    const start = normalizedText.indexMap[normalizedIndex];
    const end = normalizedText.indexMap[normalizedIndex + normalizedPaste.value.length - 1];
    if (start === undefined || end === undefined) {
      removedPastes.push({ at: paste.at, preview: toPreview(paste.text), source: paste.source });
      continue;
    }
    const spanKind: SpanKind = paste.source === 'autocomplete' ? 'pasted-autocomplete' : 'pasted-clipboard';
    for (let i = start; i <= end; i += 1) {
      if (marks[i] === 'typed') {
        marks[i] = spanKind;
      }
    }
    searchFrom = normalizedIndex + normalizedPaste.value.length;
  }

  const spans: Span[] = [];
  let buffer = text.charAt(0);
  let currentKind: SpanKind = marks[0] ?? 'typed';

  for (let i = 1; i < text.length; i += 1) {
    const nextKind = marks[i] ?? 'typed';
    if (nextKind === currentKind) {
      buffer += text.charAt(i);
      continue;
    }
    spans.push({ text: buffer, kind: currentKind });
    buffer = text.charAt(i);
    currentKind = nextKind;
  }
  spans.push({ text: buffer, kind: currentKind });

  return { spans, removedPastes };
}
