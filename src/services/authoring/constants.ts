// Constants for the assignment constructor (authored labs).
// See docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md and ADR-0008 / ADR-0006.

/**
 * The non-removable capture-disclosure core (ADR-0008). `compileLabDoc` always
 * composes this into an authored lab's integrity agreement; authors may add
 * text around it but cannot edit or remove it. Keep this wording in sync with
 * the disclosure used by built-in labs.
 */
export const CAPTURE_DISCLOSURE_CORE =
  'Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.';

/**
 * Hosts an authored lab is allowed to embed in a simulation iframe. The student
 * app sandboxes the iframe regardless; this allow-list stops the LabFrame origin
 * from being used to frame arbitrary content. A host matches if it equals an
 * entry or is a subdomain of one. Widening this list is an open question in the
 * spec; seed it with PhET.
 */
export const SIM_DOMAIN_ALLOWLIST = ['phet.colorado.edu'] as const;

// Loader caps (loadUntrustedLabDoc). Starting numbers; tune against real
// authored labs before the client relies on the constructor in production.
export const MAX_DOC_BYTES = 12 * 1024 * 1024;
export const MAX_SECTIONS = 200;
export const MAX_MARKDOWN_CHARS = 50 * 1024;
export const MAX_ASSETS = 20;
export const MAX_ASSET_BYTES = 2 * 1024 * 1024;
export const MAX_TOTAL_ASSET_BYTES = 8 * 1024 * 1024;
