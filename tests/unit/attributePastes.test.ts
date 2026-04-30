import { describe, expect, it } from 'vitest';

import { attributePastes } from '@/services/pdf/attributePastes';

describe('attributePastes', () => {
  it('matches a fully present paste', () => {
    const result = attributePastes('hello world', [
      { text: 'hello', at: 1, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans[0]).toEqual({ text: 'hello', kind: 'pasted-clipboard' });
    expect(result.removedPastes).toHaveLength(0);
  });

  it('marks fully deleted paste as removed note', () => {
    const result = attributePastes('typed only', [
      { text: 'deleted paste', at: 10, offset: 0, source: 'autocomplete' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.spans.map((span) => span.kind)).toEqual(['typed']);
  });

  it('allows punctuation and whitespace fuzzy matching', () => {
    const result = attributePastes('A, B; C', [
      { text: 'A B C', at: 1, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans.every((span) => span.kind === 'pasted-clipboard')).toBe(true);
  });

  it('handles multiple pastes in one field', () => {
    const result = attributePastes('alpha beta gamma', [
      { text: 'alpha', at: 1, offset: 0, source: 'clipboard' },
      { text: 'gamma', at: 2, offset: 10, source: 'autocomplete' },
    ]);
    expect(result.spans.some((span) => span.kind === 'pasted-clipboard')).toBe(true);
    expect(result.spans.some((span) => span.kind === 'pasted-autocomplete')).toBe(true);
  });

  it('handles overlapping pastes by keeping first attribution', () => {
    const result = attributePastes('abcdef', [
      { text: 'abcde', at: 1, offset: 0, source: 'clipboard' },
      { text: 'cdef', at: 2, offset: 2, source: 'autocomplete' },
    ]);
    expect(result.spans[0]?.kind).toBe('pasted-clipboard');
  });
});
