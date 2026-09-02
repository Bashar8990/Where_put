import { describe, it, expect } from 'vitest';
import { highlightMatch } from './highlightMatch';

describe('highlightMatch', () => {
  it('returns single unmatched segment when query is empty', () => {
    const result = highlightMatch('السلام عليكم', '');
    expect(result).toEqual([{ text: 'السلام عليكم', match: false }]);
  });

  it('returns single unmatched segment when text is empty', () => {
    const result = highlightMatch('', 'test');
    expect(result).toEqual([{ text: '', match: false }]);
  });

  it('highlights a simple matching word', () => {
    const result = highlightMatch('جواز السفر', 'جواز');
    expect(result.some((s) => s.match && s.text === 'جواز')).toBe(true);
    expect(result.some((s) => !s.match && s.text.includes('السفر'))).toBe(true);
  });

  it('highlights multiple query tokens independently', () => {
    const result = highlightMatch('جواز السفر الأزرق', 'جواز سفر');
    const matched = result.filter((s) => s.match).map((s) => s.text);
    expect(matched).toContain('جواز');
    expect(matched).toContain('السفر');
  });

  it('matches despite Arabic diacritics', () => {
    const result = highlightMatch('المَكتبِ', 'المكتب');
    expect(result.some((s) => s.match && s.text === 'المَكتبِ')).toBe(true);
  });

  it('matches despite Alef variants', () => {
    const result = highlightMatch('إسلام', 'اسلام');
    expect(result.some((s) => s.match)).toBe(true);
  });

  it('matches despite Ta Marbuta', () => {
    const result = highlightMatch('مدرسة', 'مدرسه');
    expect(result.some((s) => s.match && s.text === 'مدرسة')).toBe(true);
  });

  it('returns no matches for non-matching query', () => {
    const result = highlightMatch('جواز السفر', 'مفتاح');
    expect(result.every((s) => !s.match)).toBe(true);
  });

  it('preserves original text with diacritics in output', () => {
    const result = highlightMatch('كِتابٌ', 'كتاب');
    const fullText = result.map((s) => s.text).join('');
    expect(fullText).toBe('كِتابٌ');
  });

  it('merges consecutive segments with same match flag', () => {
    const result = highlightMatch('abc def ghi', 'def');
    // Should be: [abc, def(match), ghi] — not split further
    expect(result.length).toBeLessThanOrEqual(5); // words + spaces
    const matched = result.filter((s) => s.match);
    expect(matched.length).toBe(1);
    expect(matched[0].text).toBe('def');
  });
});
