import { normalizeArabicText } from './normalizeArabicText';

/**
 * Split text into matched / unmatched segments for search highlighting.
 *
 * Uses Arabic-normalized comparison so that searching "المكتب" highlights
 * "المَكتب", "المكتبِ", etc. The returned segments preserve the ORIGINAL
 * text (with diacritics) — only the boundaries are computed from the
 * normalized form.
 *
 * Matching is word-based: each word in the text is checked against the
 * query tokens. If a word's normalized form contains any query token,
 * the whole word is highlighted. This is robust against normalization
 * length changes (diacritic removal, letter unification) and matches
 * the behavior of common search UIs (GitHub, Gmail).
 *
 * @returns Array of `{ text, match }` segments. Single segment if no query.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q || !text) return [{ text, match: false }];

  const normQuery = normalizeArabicText(q);
  if (!normQuery) return [{ text, match: false }];

  const queryTokens = normQuery.split(' ').filter(Boolean);
  if (queryTokens.length === 0) return [{ text, match: false }];

  // Split original text into tokens (words + whitespace/punctuation).
  // We use a regex that captures delimiters so we can reconstruct the text.
  const parts = text.split(/(\s+)/);
  const segments: HighlightSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    // Whitespace segments are never matched.
    if (/^\s+$/.test(part)) {
      segments.push({ text: part, match: false });
      continue;
    }
    const normPart = normalizeArabicText(part);
    const isMatch = queryTokens.some(
      (tok) => normPart.includes(tok) || tok.includes(normPart),
    );
    segments.push({ text: part, match: isMatch });
  }

  // Merge consecutive segments with the same match flag for fewer DOM nodes.
  const merged: HighlightSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.match === seg.match) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}
