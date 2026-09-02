/**
 * Normalize Arabic text for search matching.
 * - Removes diacritics (tashkeel)
 * - Unifies Alef forms (أ إ آ ٱ → ا)
 * - Unifies Ya forms (ى → ي)
 * - Unifies Ta Marbuta (ة → ه) for looser matching
 * - Removes tatweel (ـ)
 * - Collapses whitespace
 * - Lowercases Latin letters
 * - Strips non-essential punctuation
 *
 * The original text is never mutated; normalization is only used for search.
 */
export function normalizeArabicText(input: string): string {
  if (!input) return '';
  let s = String(input);

  // Remove Arabic diacritics (tashkeel) U+064B..U+065F and U+0670
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');

  // Remove tatweel
  s = s.replace(/\u0640/g, '');

  // Unify Alef forms
  s = s.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627'); // آ أ إ ٱ → ا

  // Unify Ya: ى → ي
  s = s.replace(/\u0649/g, '\u064A');

  // Ta Marbuta → Ha for looser matching (ة → ه)
  s = s.replace(/\u0629/g, '\u0647');

  // Normalize Waqf marks
  s = s.replace(/[\u06D6-\u06ED]/g, '');

  // Lowercase Latin
  s = s.toLowerCase();

  // Replace any punctuation with space (keep Arabic letters, Latin letters, digits)
  s = s.replace(/[^\p{L}\p{N}]+/gu, ' ');

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/** Tokenize normalized text into unique words. */
export function tokenizeNormalized(normalized: string): string[] {
  if (!normalized) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of normalized.split(' ')) {
    if (!tok) continue;
    if (seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}
