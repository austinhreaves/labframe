import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { canonicalize } from '@/services/integrity/canonicalize';

/**
 * Property-based invariants for the answer-envelope canonicalizer. The signed
 * integrity envelope depends on canonicalize() being a deterministic,
 * order-independent function: if two students' equivalent answers canonicalize
 * differently, grading records misalign and signatures stop being comparable.
 * One property replaces a hundred hand-picked examples and tends to find the
 * input we did not think of. Surface: src/services/integrity/canonicalize.ts.
 */

// Finite numbers only: canonicalize throws on NaN/Infinity by contract. Bounding
// min/max keeps every draw finite across fast-check versions; -0 is allowed on
// purpose (the -0 -> 0 normalization is exercised below).
const finiteNumber = fc.double({ min: -1e9, max: 1e9, noNaN: true });
const scalar = fc.oneof(fc.string(), fc.boolean(), fc.constant(null), finiteNumber);

// Arbitrary JSON-ish trees of the value types canonicalize supports.
const jsonLike: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
  value: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    scalar,
    fc.array(tie('value'), { maxLength: 4 }),
    fc.dictionary(fc.string(), tie('value'), { maxKeys: 4 }),
  ),
})).value;

describe('canonicalize properties', () => {
  it('is idempotent through a JSON round-trip', () => {
    fc.assert(
      fc.property(jsonLike, (value) => {
        const once = canonicalize(value);
        expect(canonicalize(JSON.parse(once))).toBe(once);
      }),
    );
  });

  it('is invariant to object key insertion order', () => {
    const entries = fc.uniqueArray(fc.tuple(fc.string({ minLength: 1 }), scalar), {
      selector: ([key]) => key,
      maxLength: 8,
    });
    fc.assert(
      fc.property(entries, (pairs) => {
        const forward = Object.fromEntries(pairs);
        const reversed = Object.fromEntries([...pairs].reverse());
        expect(canonicalize(reversed)).toBe(canonicalize(forward));
      }),
    );
  });

  it('normalizes negative zero to zero', () => {
    expect(canonicalize({ v: -0 })).toBe(canonicalize({ v: 0 }));
    expect(canonicalize([-0])).toBe(canonicalize([0]));
  });
});
