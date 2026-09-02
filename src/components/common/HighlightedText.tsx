import { highlightMatch, type HighlightSegment } from '../../utils/highlightMatch';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Renders text with matched query portions wrapped in `<mark>`.
 *
 * Uses Arabic-normalized matching via `highlightMatch` so diacritics,
 * Alef/Ya variants, and Ta Marbuta are handled transparently.
 */
export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const segments: HighlightSegment[] = query ? highlightMatch(text, query) : [{ text, match: false }];

  if (segments.length === 1 && !segments[0].match) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark
            key={i}
            className="bg-brand-200/60 dark:bg-brand-400/25 text-app rounded-[3px] px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
