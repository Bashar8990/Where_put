import { describe, expect, it } from 'vitest';
import { normalizeArabicText, tokenizeNormalized } from './normalizeArabicText';

describe('normalizeArabicText', () => {
  it('unifies Alef forms', () => {
    expect(normalizeArabicText('أحمد إبراهيم آدم')).toBe('احمد ابراهيم ادم');
  });

  it('removes tashkeel', () => {
    expect(normalizeArabicText('جوازُ السفرِ')).toBe('جواز السفر');
  });

  it('unifies Ya (ى → ي)', () => {
    expect(normalizeArabicText('عُذري')).toBe('عذري');
  });

  it('converts ta marbuta to ha', () => {
    expect(normalizeArabicText('مدرسة')).toBe('مدرسه');
  });

  it('removes tatweel', () => {
    expect(normalizeArabicText('الـــسلام')).toBe('السلام');
  });

  it('lowercases latin and strips punctuation', () => {
    expect(normalizeArabicText('USB, charger!')).toBe('usb charger');
  });

  it('collapses whitespace', () => {
    expect(normalizeArabicText('  جواز   السفر  ')).toBe('جواز السفر');
  });

  it('handles empty input', () => {
    expect(normalizeArabicText('')).toBe('');
  });
});

describe('tokenizeNormalized', () => {
  it('returns unique tokens', () => {
    expect(tokenizeNormalized('جواز السفر جواز')).toEqual(['جواز', 'السفر']);
  });
});
