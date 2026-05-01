import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/sign
 *
 * Body: { canonical: string }   — JSON.stringify(canonicalize(labAnswers))
 * 200:  { signature: string, signedAt: number }
 * 400:  { error: 'Invalid body' }
 * 405:  { error: 'Method not allowed' }
 * 413:  { error: 'Payload too large' }
 * 500:  { error: 'Server misconfigured' }
 *
 * The HMAC-SHA256 secret lives in env var LAB_SIGNING_SECRET. Set it in the
 * Vercel project's Environment Variables — never commit it to the repo.
 *
 * Threat model honesty: this catches casual tampering (a student editing the
 * PDF in Acrobat) but does NOT catch a student who modifies the canonical
 * JSON and re-POSTs to /api/sign for a fresh signature. Closing that gap
 * requires nonce binding (v1.1). See REBUILD_SPEC.md §5.14.
 */
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

function reject(res: VercelResponse, status: number, error: string, reason: string): void {
  console.warn(`[sign] reject status=${status} reason=${reason}`);
  res.status(status).json({ error });
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    reject(res, 405, 'Method not allowed', 'invalid_method');
    return;
  }

  const secret = process.env.LAB_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    reject(res, 500, 'Server misconfigured', 'missing_or_short_secret');
    return;
  }

  const body = req.body as unknown;
  if (!body || typeof body !== 'object' || !('canonical' in body)) {
    reject(res, 400, 'Invalid body', 'missing_canonical');
    return;
  }
  const { canonical } = body as { canonical: unknown };
  if (typeof canonical !== 'string' || canonical.length === 0) {
    reject(res, 400, 'Invalid body', 'canonical_not_string_or_empty');
    return;
  }
  if (Buffer.byteLength(canonical, 'utf8') > MAX_PAYLOAD_BYTES) {
    reject(res, 413, 'Payload too large', 'payload_too_large');
    return;
  }

  const signedAt = Date.now();
  const hmac = createHmac('sha256', secret);
  hmac.update(canonical, 'utf8');
  hmac.update('|', 'utf8');
  hmac.update(String(signedAt), 'utf8');
  const signature = hmac.digest('hex');

  // Logging: length and first-8-of-sig only. NEVER log canonical content.
  console.log(`[sign] ok len=${canonical.length} sig=${signature.slice(0, 8)} at=${signedAt}`);

  res.status(200).json({ signature, signedAt });
}

// Exposed for unit testing — not used by the Vercel runtime.
export function _verifyForTests(args: {
  canonical: string;
  signedAt: number;
  signature: string;
  secret: string;
}): boolean {
  const { canonical, signedAt, signature, secret } = args;
  const hmac = createHmac('sha256', secret);
  hmac.update(canonical, 'utf8');
  hmac.update('|', 'utf8');
  hmac.update(String(signedAt), 'utf8');
  const expected = hmac.digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
