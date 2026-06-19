# ADR-0003: Images are first-class submission content, bound to the signature by hash

**Status:** Accepted 2026-06-10. Supersedes the text-only stance in the original integrity draft (now `docs/specs/INTEGRITY_INSPECTOR_SPEC.md`). Implementation pending (envelope v6; v5 was consumed by the assignment-constructor `labHash` binding, see [ADR-0009](./0009-labhash-binding-and-embedded-labdoc.md)).

## Context

The shipped lab content and the integrity design contradicted each other:

- Nearly every lab includes `image` sections (screenshot uploads) carrying point values.
- The integrity draft declared `LabAnswers` "text-only by design" and treated image support as a hypothetical.
- The exported PDF rendered only "Attachment metadata: included", so the grader never saw the image and the submission artifact permanently lacked it.
- The canonical envelope carried `{idbKey, mime, bytes}` with no binding to the actual bytes, so the signature did not cover image content.
- `docs/DATA_HANDLING.md` claimed image bytes were embedded in the PDF.

"Screenshot your circuit" is pedagogically valuable and the labs already depend on it, so removing images would mean rewriting shipped content for an architectural preference.

## Decision

Images are part of the graded, signed submission:

1. The exported PDF embeds each uploaded image visually in its section (draft and signed modes).
2. The canonical envelope's `images` entries gain `sha256` (hex digest of the blob bytes). The binary stays out of the JSON; the hash binds the signature to the content. Ships as part of envelope v6.
3. Upload limits become real: `maxMB` and image MIME type are enforced in the dropzone for both the file picker and the drag-drop path.
4. Consumers that decode student image bytes (the Integrity Inspector, any future TA tooling) treat them as untrusted: `createImageBitmap()` round-trip validation and EXIF strip before display.

## Consequences

- Envelope v6 schema change and a one-time PDF size review (target stays under ~2 MB typical; JPEG re-encode if screenshots push past it).
- Verification of an image dispute is now possible: recompute the hash of the bytes in question against the signed envelope.
- `docs/DATA_HANDLING.md` becomes factually correct on this point once implemented.
- The Inspector's scope includes image display with the hardening above.
