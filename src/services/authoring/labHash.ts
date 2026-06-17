import type { LabDoc } from '@/domain/schema/labDoc';
import { canonicalize } from '@/services/integrity/canonicalize';

/**
 * Content hash that is an authored lab's identity (ADR-0005) and the value the
 * signed envelope binds (ADR-0009). Hex SHA-256 over the canonical LabDoc.
 *
 * Note: `canonicalize` currently sorts keys with `localeCompare`. The envelope
 * v5 code-unit fix (docs/SPEC.md section 6) is a prerequisite for this hash to
 * be authoritative across environments; until then it is stable within one
 * environment, which is sufficient for Phase A local use.
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
