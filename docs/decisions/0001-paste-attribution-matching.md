# ADR-0001: Paste attribution uses literal substring matching, not edit distance

**Status:** Accepted (implemented 2026-05; recorded as ADR 2026-06-10)

## Context

The PDF renders pasted text with inline visual differentiation (italics for clipboard, distinct style for autocomplete). `attributePastes(text, pastes)` in `src/services/pdf/attributePastes.ts` maps recorded paste events onto the final field text. The matcher's failure modes are asymmetric:

- A **false negative** (an edited paste loses its inline marking) is tolerable: the paste still appears in the Process Record appendix with timestamp and preview.
- A **false positive** (typed prose marked as pasted) is a grading-integrity reversal and is not tolerable.

Edit-distance and LCS-ratio matching raise recall on edited pastes but create real false-positive risk on short strings: a 5-character paste of `1.33` would fuzzy-match almost any sentence containing those digits.

## Decision

Normalize both sides (strip whitespace and soft punctuation, lowercase), then match with literal `indexOf` only. Binary outcome: a paste either appears as a contiguous normalized substring of the final text, or it goes to the `removedPastes` summary. No edit distance, no LCS, no similarity ratios.

## Consequences

- Edited pastes lose inline italics but remain disclosed in the appendix. This is the intended trade.
- The behavior is pinned by boundary tests in `tests/unit/attributePastes.test.ts`. Any future matcher upgrade must revisit this ADR and update those tests deliberately.
- The Integrity Inspector (separate, investigation-only surface) is the right home for fuzzier matching, because no grade hangs on its output.
