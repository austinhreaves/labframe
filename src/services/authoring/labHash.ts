import type { LabDoc } from '@/domain/schema/labDoc';
import { canonicalize } from '@/services/integrity/canonicalize';

/**
 * Content hash that is an authored lab's identity (ADR-0005) and the value the
 * signed envelope binds (ADR-0009). Hex SHA-256 over the canonical LabDoc.
 *
 * `canonicalize` sorts object keys by UTF-16 code unit (envelope v5,
 * docs/SPEC.md section 6), so this hash is reproducible across environments.
 */
export async function hashLabDoc(doc: LabDoc): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('SubtleCrypto is unavailable; cannot compute the LabDoc content hash.');
  }
  const bytes = new TextEncoder().encode(canonicalize(doc));
  const digest = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
