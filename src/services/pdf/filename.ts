import type { Lab } from '@/domain/schema';

type BuildPdfFilenameInput = {
  lab: Lab;
  studentName: string;
  signedAt: number;
  signature: string;
};

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_ALNUM_CHUNKS = /[^A-Za-z0-9]+/g;
const ROMAN_NUMERAL = /^[IVXLCDM]+$/i;

function toTitleCaseChunk(chunk: string): string {
  if (!chunk) {
    return '';
  }

  if (chunk.length > 1 && ROMAN_NUMERAL.test(chunk)) {
    return chunk.toUpperCase();
  }

  const first = chunk.slice(0, 1).toUpperCase();
  const rest = chunk.slice(1).toLowerCase();
  return `${first}${rest}`;
}

function normalizeAsciiTitleCase(input: string): string {
  const normalized = input.normalize('NFKD').replace(COMBINING_MARKS, '');
  return normalized
    .split(NON_ALNUM_CHUNKS)
    .map((chunk) => chunk.replace(/[^A-Za-z0-9]/g, ''))
    .filter((chunk) => chunk.length > 0)
    .map(toTitleCaseChunk)
    .join('');
}

function normalizeLabTitle(input: string): string {
  const normalized = input.normalize('NFKD').replace(COMBINING_MARKS, '');
  return normalized
    .split(/\s+/)
    .map((chunk) => chunk.replace(/[^A-Za-z0-9]/g, ''))
    .filter((chunk) => chunk.length > 0)
    .map(toTitleCaseChunk)
    .join('');
}

export function buildPdfFilename({ lab, studentName, signedAt, signature }: BuildPdfFilenameInput): string {
  const labToken = normalizeLabTitle(lab.title) || lab.id;
  const studentToken = normalizeAsciiTitleCase(studentName) || 'Student';
  const dateToken = new Date(signedAt).toISOString().slice(0, 10);
  const signatureToken = signature.slice(0, 8);
  return `${labToken}_${studentToken}_${dateToken}_${signatureToken}.pdf`;
}
