# ADR-0004: Integrity model is disclosure, not prevention

**Status:** Accepted (design review 2026-04-29; recorded as ADR 2026-06-10)

## Context

The legacy app tried prevention: paste blocking, copy interception, monkey-patched event listeners, tamper flags that deleted student work on heuristic mismatches. It deterred no cheating, broke accessibility (IME, screen readers, autofill), and destroyed legitimate work. Frontend prevention is theater because the student owns the runtime.

## Decision

LabFrame captures and discloses instead of blocking:

- Every text input records construction history: paste events with full content and source (clipboard, autocomplete, IME), keystroke and delete counts, focus timing.
- The integrity agreement tells students exactly what is recorded and that it appears in the PDF. Capture without disclosure is a trap, not pedagogy.
- The record is sealed inside the signed canonical envelope, not in clearable side storage.
- Nothing is ever blocked: no paste interception, no selection clearing, no context-menu games, no hidden bait text in instructions.

Boundaries on interpretation (refined 2026-06-10):

- Paste content is the strong signal. Keystroke counts and active time are weak, gameable signals; the grading PDF must not invite overreach. The Process Record appendix reports time in coarse bands rather than raw milliseconds and excludes IME paste counts (which flag CJK typists, not misconduct). Granular forensics belong in the Integrity Inspector, an investigation surface where no grade is directly assigned.
- AI use is handled by the same philosophy: a disclosure checkbox plus share links, signed into the envelope, rather than detection heuristics.

## Consequences

- A motivated cheater can type a transcription and look clean. Accepted: the model raises the cost of lazy workflows and produces honest evidence, not certainty.
- TAs need a one-paragraph briefing on what the Process Record can and cannot support before grading with it.
- Any future "detection" feature proposal must be argued against this ADR first.
