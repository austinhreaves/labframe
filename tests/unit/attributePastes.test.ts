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

  it('paste fully present with no edits: entire field is one pasted-clipboard span', () => {
    const text = 'sin theta = n';
    const result = attributePastes(text, [
      { text: 'sin theta = n', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans).toEqual([{ text, kind: 'pasted-clipboard' }]);
    expect(result.removedPastes).toHaveLength(0);
  });

  it('paste fully present amid typed text: only the pasted substring is attributed', () => {
    const result = attributePastes('The index of refraction is 1.33 for water', [
      { text: '1.33', at: 5, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans).toEqual([
      { text: 'The index of refraction is ', kind: 'typed' },
      { text: '1.33', kind: 'pasted-clipboard' },
      { text: ' for water', kind: 'typed' },
    ]);
    expect(result.removedPastes).toHaveLength(0);
  });

  it('paste with whitespace-only edits still matches (extra space)', () => {
    const result = attributePastes('sin  theta', [
      { text: 'sin theta', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans).toEqual([{ text: 'sin  theta', kind: 'pasted-clipboard' }]);
    expect(result.removedPastes).toHaveLength(0);
  });

  it('paste with punctuation-only edits still matches; trailing period maps outside normalized span → typed', () => {
    const result = attributePastes('sin theta.', [
      { text: 'sin theta', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans).toEqual([
      { text: 'sin theta', kind: 'pasted-clipboard' },
      { text: '.', kind: 'typed' },
    ]);
    expect(result.removedPastes).toHaveLength(0);
  });

  it('marks fully deleted paste as removed note', () => {
    const result = attributePastes('typed only', [
      { text: 'deleted paste', at: 10, offset: 0, source: 'autocomplete' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.spans.map((span) => span.kind)).toEqual(['typed']);
  });

  it('paste fully deleted: no substring left in final text → removedPastes only', () => {
    const result = attributePastes('student typed this instead', [
      { text: 'the answer is 42', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.removedPastes[0]?.preview).toContain('the answer is 42');
    expect(result.spans.every((s) => s.kind === 'typed')).toBe(true);
  });

  it('paste partially edited (word inserted mid-string) → no inline match', () => {
    const finalText = 'the index of approximately refraction';
    const result = attributePastes(finalText, [
      { text: 'the index of refraction', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.spans).toEqual([{ text: finalText, kind: 'typed' }]);
  });

  it('paste partially deleted (suffix removed): entire normalized paste must appear → removedPastes', () => {
    const result = attributePastes('the answer is 42', [
      { text: 'the answer is 42 plus seven', at: 0, offset: 0, source: 'clipboard' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.spans.every((s) => s.kind === 'typed')).toBe(true);
  });

  it('allows punctuation and whitespace fuzzy matching', () => {
    const result = attributePastes('A, B; C', [
      { text: 'A B C', at: 1, offset: 0, source: 'clipboard' },
    ]);
    expect(result.spans.every((span) => span.kind === 'pasted-clipboard')).toBe(true);
  });

  it('multiple pastes: both match when both normalized substrings appear left-to-right', () => {
    const result = attributePastes('intro first part mid second part outro', [
      { text: 'first part', at: 1, offset: 0, source: 'clipboard' },
      { text: 'second part', at: 2, offset: 20, source: 'clipboard' },
    ]);
    expect(result.spans).toEqual([
      { text: 'intro ', kind: 'typed' },
      { text: 'first part', kind: 'pasted-clipboard' },
      { text: ' mid ', kind: 'typed' },
      { text: 'second part', kind: 'pasted-clipboard' },
      { text: ' outro', kind: 'typed' },
    ]);
    expect(result.removedPastes).toHaveLength(0);
  });

  it('handles multiple pastes in one field', () => {
    const result = attributePastes('alpha beta gamma', [
      { text: 'alpha', at: 1, offset: 0, source: 'clipboard' },
      { text: 'gamma', at: 2, offset: 10, source: 'autocomplete' },
    ]);
    expect(result.spans.some((span) => span.kind === 'pasted-clipboard')).toBe(true);
    expect(result.spans.some((span) => span.kind === 'pasted-autocomplete')).toBe(true);
  });

  it('overlapping normalized candidates: first paste wins on shared characters; later paste does not replace kinds', () => {
    const result = attributePastes('abcdef', [
      { text: 'abcde', at: 1, offset: 0, source: 'clipboard' },
      { text: 'cdef', at: 2, offset: 2, source: 'autocomplete' },
    ]);
    expect(result.spans[0]?.kind).toBe('pasted-clipboard');
  });

  it('sequential search after first match: overlapping phrase pastes can leave later paste unmatched', () => {
    const result = attributePastes('abc def ghi', [
      { text: 'abc def', at: 0, offset: 0, source: 'clipboard' },
      { text: 'def ghi', at: 1, offset: 8, source: 'autocomplete' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.removedPastes[0]?.preview).toBe('def ghi');
    expect(result.spans.some((s) => s.kind === 'pasted-autocomplete')).toBe(false);
  });

  it('paste normalizing to empty (e.g. pure punctuation) does not attribute the whole field', () => {
    const result = attributePastes('hello, world', [
      { text: ',', at: 5, offset: 0, source: 'clipboard' },
    ]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.removedPastes[0]?.source).toBe('clipboard');
    expect(result.spans.every((s) => s.kind === 'typed')).toBe(true);
  });

  it('Unicode: accented paste vs ASCII-only final text — current matcher does not equate é with e (triage: possible follow-up)', () => {
    const result = attributePastes('jose', [{ text: 'José', at: 0, offset: 0, source: 'clipboard' }]);
    expect(result.removedPastes).toHaveLength(1);
    expect(result.spans).toEqual([{ text: 'jose', kind: 'typed' }]);
  });

  it('clipboard vs autocomplete sources map to distinct span kinds', () => {
    const result = attributePastes('hello world', [
      { text: 'hello', at: 0, offset: 0, source: 'clipboard' },
      { text: 'world', at: 6, offset: 6, source: 'autocomplete' },
    ]);
    expect(result.spans).toEqual([
      { text: 'hello', kind: 'pasted-clipboard' },
      { text: ' ', kind: 'typed' },
      { text: 'world', kind: 'pasted-autocomplete' },
    ]);
  });
});
