import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';
import {
  buildAuthorshipProfile,
  buildNudges,
  type AuthorshipProfile,
  type Nudge,
} from './_authorship';

/**
 * POST /api/verify
 *
 * Body: raw PDF bytes (application/octet-stream), max 20 MB.
 * Header: X-Verify-Passphrase - checked against VERIFY_PASSPHRASE env var.
 *
 * 200: VerifyResponse (valid, legacy, signedAt, meta, checks, profile, nudges)
 * 401: wrong or missing passphrase
 * 400: missing/unreadable body
 * 413: payload too large
 * 422: PDF parsed but lab.json missing or unreadable
 * 500: server misconfigured (missing secret)
 *
 * Cryptographic verdict: HMAC-SHA256(canonical | signedAt) constant-time compare.
 * Advisory checks + authorship profile + nudges: computed from the parsed canonical
 * answers, returned alongside valid but strictly orthogonal to it (they never change
 * the cryptographic verdict). Legacy PDFs (pre-envelope, lab.json was raw canonical
 * string): structural match only, no cryptographic verdict possible.
 */

const MAX_PDF_BYTES = 20 * 1024 * 1024;

type Check = {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
};

type VerifyResponse = {
  valid: boolean | null;
  legacy: boolean;
  signedAt?: number;
  meta?: { studentName: string; taName: string };
  checks: Check[];
  profile?: AuthorshipProfile;
  nudges?: Nudge[];
  error?: string;
};

function reject(res: VercelResponse, status: number, error: string): void {
  const body: Partial<VerifyResponse> = { error };
  res.status(status).json(body);
}

function getStreamContents(stream: unknown): Uint8Array {
  const s = stream as {
    contents?: Uint8Array;
    dict?: { get: (n: unknown) => unknown };
  };
  if (!s.contents || s.contents.length === 0) throw new Error('Empty stream');
  const filter = s.dict?.get(PDFName.of('Filter'));
  if (filter && String(filter).includes('FlateDecode')) {
    return new Uint8Array(inflateSync(s.contents));
  }
  return s.contents;
}

type ExtractResult =
  | { legacy: false; canonical: string; signature: string; signedAt: number }
  | { legacy: true; canonical: string };

async function extractEnvelope(pdfBytes: Uint8Array): Promise<ExtractResult> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const ctx = pdfDoc.context;

  // Navigate: Catalog -> Names -> EmbeddedFiles -> Names array -> lab.json FileSpec
  const namesRef = (pdfDoc.catalog as unknown as { get: (n: unknown) => unknown }).get(
    PDFName.of('Names'),
  );
  if (!namesRef) throw new Error('No Names dictionary');
  const namesDict = ctx.lookup(namesRef as Parameters<typeof ctx.lookup>[0], PDFDict);

  const efRef = namesDict.get(PDFName.of('EmbeddedFiles'));
  if (!efRef) throw new Error('No EmbeddedFiles');
  const efDict = ctx.lookup(efRef as Parameters<typeof ctx.lookup>[0], PDFDict);

  const namesArrRef = efDict.get(PDFName.of('Names'));
  if (!namesArrRef) throw new Error('No Names array in EmbeddedFiles');
  const namesArr = ctx.lookup(namesArrRef as Parameters<typeof ctx.lookup>[0], PDFArray);

  for (let i = 0; i + 1 < namesArr.size(); i += 2) {
    const nameObj = namesArr.lookup(i) as unknown as {
      decodeText?: () => string;
      value?: string;
    };
    const name = nameObj.decodeText?.() ?? nameObj.value ?? '';
    if (name !== 'lab.json') continue;

    const fileSpecRef = namesArr.get(i + 1);
    const fileSpec = ctx.lookup(fileSpecRef as Parameters<typeof ctx.lookup>[0], PDFDict);
    const efEntryRef = fileSpec.get(PDFName.of('EF'));
    const efEntry = ctx.lookup(efEntryRef as Parameters<typeof ctx.lookup>[0], PDFDict);
    const streamRef = efEntry.get(PDFName.of('F'));
    const stream = ctx.lookup(streamRef as Parameters<typeof ctx.lookup>[0]);

    const bytes = getStreamContents(stream);
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text) as unknown;

    // Legacy: lab.json was the raw canonical string, not an envelope object
    if (typeof parsed === 'string') {
      return { legacy: true, canonical: parsed };
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'canonical' in parsed &&
      'signature' in parsed &&
      'signedAt' in parsed
    ) {
      const env = parsed as { canonical: unknown; signature: unknown; signedAt: unknown };
      if (
        typeof env.canonical !== 'string' ||
        typeof env.signature !== 'string' ||
        typeof env.signedAt !== 'number'
      ) {
        throw new Error('Malformed envelope fields');
      }
      return {
        legacy: false,
        canonical: env.canonical,
        signature: env.signature,
        signedAt: env.signedAt,
      };
    }

    throw new Error('Unrecognized lab.json format');
  }

  throw new Error('lab.json attachment not found in PDF');
}

function hmacHex(canonical: string, signedAt: number, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(canonical, 'utf8');
  hmac.update('|', 'utf8');
  hmac.update(String(signedAt), 'utf8');
  return hmac.digest('hex');
}

function runAdvisoryChecks(canonical: string): Check[] {
  const checks: Check[] = [];

  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(canonical) as Record<string, unknown>;
  } catch {
    return [{ id: 'parse', label: 'Canonical JSON parseable', pass: false }];
  }

  // Integrity agreement
  const integrity = answers['integrity'] as Record<string, unknown> | undefined;
  checks.push({
    id: 'integrity_agreement',
    label: 'Integrity agreement accepted',
    pass: integrity?.['agreementAccepted'] === true,
  });

  // AI declaration consistency
  const aiUsed = integrity?.['aiUsed'] === true;
  const aiLinks =
    typeof integrity?.['aiSharedLinks'] === 'string'
      ? (integrity['aiSharedLinks'] as string).trim()
      : '';
  const aiConsistent = !aiUsed || aiLinks.length > 0;
  const aiDetail = aiUsed
    ? aiConsistent
      ? 'Links provided'
      : 'AI used but no links provided'
    : 'AI not used';
  checks.push({
    id: 'ai_declaration',
    label: 'AI usage declaration consistent',
    pass: aiConsistent,
    detail: aiDetail,
  });

  // Identity
  const meta = answers['meta'] as Record<string, unknown> | undefined;
  const studentName =
    typeof meta?.['studentName'] === 'string' ? (meta['studentName'] as string).trim() : '';
  const taName = typeof meta?.['taName'] === 'string' ? (meta['taName'] as string).trim() : '';
  const hasName = studentName.length > 0 && studentName !== 'Student';
  const hasTA = taName.length > 0;
  const identityDetail = !hasName
    ? 'Student name missing or placeholder'
    : !hasTA
      ? 'TA name missing'
      : undefined;
  checks.push({
    id: 'identity',
    label: 'Student and TA names present',
    pass: hasName && hasTA,
    ...(identityDetail !== undefined ? { detail: identityDetail } : {}),
  });

  // Fields completeness
  const fields = answers['fields'] as Record<string, unknown> | undefined;
  if (fields) {
    const emptyCount = Object.values(fields).filter((v) => {
      const fv = v as { text?: string } | undefined;
      return !fv?.text || fv.text.trim().length === 0;
    }).length;
    checks.push({
      id: 'fields_completeness',
      label: 'All fields answered',
      pass: emptyCount === 0,
      ...(emptyCount > 0 ? { detail: `${emptyCount} empty field(s)` } : {}),
    });
  }

  // Tables completeness
  const tables = answers['tables'] as Record<string, unknown[]> | undefined;
  if (tables) {
    let emptyRows = 0;
    for (const rows of Object.values(tables)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const cells = Object.values(row as Record<string, unknown>);
        if (cells.every((c) => !(c as { text?: string })?.text?.trim())) emptyRows++;
      }
    }
    checks.push({
      id: 'tables_completeness',
      label: 'All table rows filled',
      pass: emptyRows === 0,
      ...(emptyRows > 0 ? { detail: `${emptyRows} empty row(s)` } : {}),
    });
  }

  // Fit coverage
  const selectedFits = answers['selectedFits'] as Record<string, unknown> | undefined;
  if (selectedFits) {
    const missed = Object.values(selectedFits).filter((v) => v === null).length;
    checks.push({
      id: 'fit_coverage',
      label: 'All curve fits selected',
      pass: missed === 0,
      ...(missed > 0 ? { detail: `${missed} unselected fit(s)` } : {}),
    });
  }

  return checks;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    reject(res, 405, 'Method not allowed');
    return;
  }

  const secret = process.env.LAB_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    reject(res, 500, 'Server misconfigured');
    return;
  }

  // Passphrase gate
  const passphrase = process.env.VERIFY_PASSPHRASE;
  if (passphrase) {
    const provided = req.headers['x-verify-passphrase'];
    if (provided !== passphrase) {
      reject(res, 401, 'Invalid access code');
      return;
    }
  }

  // Body is raw PDF bytes via octet-stream
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    totalBytes += buf.length;
    if (totalBytes > MAX_PDF_BYTES) {
      reject(res, 413, 'PDF too large (max 20 MB)');
      return;
    }
    chunks.push(buf);
  }

  if (totalBytes === 0) {
    reject(res, 400, 'Empty body');
    return;
  }

  const pdfBytes = new Uint8Array(Buffer.concat(chunks));

  let envelope: ExtractResult;
  try {
    envelope = await extractEnvelope(pdfBytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown extraction error';
    res
      .status(422)
      .json({ error: `Could not read lab.json: ${msg}` } satisfies Partial<VerifyResponse>);
    return;
  }

  if (envelope.legacy) {
    const checks = runAdvisoryChecks(envelope.canonical);
    const profile = buildAuthorshipProfile(envelope.canonical);
    const nudges = profile ? buildNudges(profile) : [];
    const body: VerifyResponse = {
      valid: null,
      legacy: true,
      checks,
      ...(profile ? { profile } : {}),
      ...(nudges.length > 0 ? { nudges } : {}),
    };
    res.status(200).json(body);
    return;
  }

  const expected = hmacHex(envelope.canonical, envelope.signedAt, secret);
  const actual = envelope.signature;
  let valid = false;
  try {
    if (expected.length === actual.length) {
      valid = timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
    }
  } catch {
    valid = false;
  }

  const checks = runAdvisoryChecks(envelope.canonical);

  let meta: VerifyResponse['meta'];
  try {
    const parsed = JSON.parse(envelope.canonical) as Record<string, unknown>;
    const m = parsed['meta'] as Record<string, unknown> | undefined;
    if (m) {
      meta = {
        studentName: String(m['studentName'] ?? ''),
        taName: String(m['taName'] ?? ''),
      };
    }
  } catch {
    // advisory only
  }

  const profile = buildAuthorshipProfile(envelope.canonical);
  const nudges = profile ? buildNudges(profile) : [];

  const body: VerifyResponse = {
    valid,
    legacy: false,
    signedAt: envelope.signedAt,
    ...(meta !== undefined ? { meta } : {}),
    checks,
    ...(profile ? { profile } : {}),
    ...(nudges.length > 0 ? { nudges } : {}),
  };
  res.status(200).json(body);
}
