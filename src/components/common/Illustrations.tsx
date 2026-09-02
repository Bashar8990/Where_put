/**
 * Lightweight, color-tinted SVG illustrations for empty states.
 *
 * Each illustration is a simple, friendly scene rendered with brand colors
 * that adapts to light/dark mode via `currentColor` and CSS variables.
 * They replace the plain Lucide icons in EmptyState for a more polished,
 * product-grade feel (à la Stripe / Linear).
 *
 * All illustrations are pure SVG with no external assets — they bundle
 * into the JS and work offline.
 */

interface IllustrationProps {
  className?: string;
}

const SIZE = 96;

function Wrapper({ className, children }: IllustrationProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={SIZE}
      height={SIZE}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** First-run: an open box with a question mark — "start storing things". */
export function FirstRunIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      {/* Soft background blob */}
      <circle cx="60" cy="60" r="50" fill="var(--color-brand-100)" opacity="0.5" className="dark:opacity-20" />
      {/* Open box */}
      <path
        d="M35 65 L60 50 L85 65 L85 85 L60 100 L35 85 Z"
        fill="var(--color-brand-500)"
        opacity="0.15"
      />
      <path
        d="M35 65 L60 50 L85 65 L60 80 Z"
        fill="var(--color-brand-500)"
        opacity="0.3"
      />
      <path
        d="M35 65 L60 80 L60 100 L35 85 Z"
        fill="var(--color-brand-600)"
        opacity="0.2"
      />
      <path
        d="M85 65 L60 80 L60 100 L85 85 Z"
        fill="var(--color-brand-600)"
        opacity="0.3"
      />
      {/* Question mark floating above */}
      <circle cx="60" cy="30" r="14" fill="var(--color-brand-500)" opacity="0.2" />
      <text
        x="60"
        y="36"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--color-brand-600)"
        className="dark:fill-brand-400"
        fontFamily="inherit"
      >
        ؟
      </text>
      {/* Sparkles */}
      <circle cx="30" cy="40" r="2" fill="var(--color-brand-400)" opacity="0.6" />
      <circle cx="92" cy="45" r="2.5" fill="var(--color-brand-400)" opacity="0.5" />
      <circle cx="95" cy="25" r="1.5" fill="var(--color-brand-300)" opacity="0.7" />
    </Wrapper>
  );
}

/** No search results: a magnifier with an empty result card. */
export function NoResultsIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      <circle cx="60" cy="60" r="50" fill="var(--color-brand-100)" opacity="0.5" className="dark:opacity-20" />
      {/* Result card (empty) */}
      <rect x="38" y="35" width="44" height="30" rx="6" fill="var(--color-brand-500)" opacity="0.15" />
      <rect x="38" y="35" width="44" height="30" rx="6" stroke="var(--color-brand-500)" strokeWidth="1.5" opacity="0.3" />
      <line x1="46" y1="45" x2="68" y2="45" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="46" y1="53" x2="62" y2="53" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      {/* Magnifier */}
      <circle cx="72" cy="72" r="16" stroke="var(--color-brand-600)" strokeWidth="3" className="dark:stroke-brand-400" />
      <line x1="83" y1="83" x2="92" y2="92" stroke="var(--color-brand-600)" strokeWidth="3.5" strokeLinecap="round" className="dark:stroke-brand-400" />
      {/* X inside magnifier */}
      <line x1="67" y1="67" x2="77" y2="77" stroke="var(--color-brand-600)" strokeWidth="2" strokeLinecap="round" className="dark:stroke-brand-400" />
      <line x1="77" y1="67" x2="67" y2="77" stroke="var(--color-brand-600)" strokeWidth="2" strokeLinecap="round" className="dark:stroke-brand-400" />
    </Wrapper>
  );
}

/** No favorites: an empty star outline with a dashed circle. */
export function NoFavoritesIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      <circle cx="60" cy="60" r="50" fill="#fef3c7" opacity="0.4" className="dark:opacity-15" />
      {/* Dashed ring */}
      <circle cx="60" cy="55" r="28" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" className="dark:stroke-amber-500" />
      {/* Empty star */}
      <path
        d="M60 38 L65.5 49 L77.5 51 L69 59.5 L71 71.5 L60 66 L49 71.5 L51 59.5 L42.5 51 L54.5 49 Z"
        fill="#fbbf24"
        opacity="0.15"
        className="dark:fill-amber-500"
      />
      <path
        d="M60 38 L65.5 49 L77.5 51 L69 59.5 L71 71.5 L60 66 L49 71.5 L51 59.5 L42.5 51 L54.5 49 Z"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinejoin="round"
        className="dark:stroke-amber-400"
      />
      {/* Small plus indicator */}
      <circle cx="82" cy="38" r="8" fill="#fbbf24" opacity="0.2" className="dark:fill-amber-500" />
      <line x1="82" y1="35" x2="82" y2="41" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="dark:stroke-amber-400" />
      <line x1="79" y1="38" x2="85" y2="38" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="dark:stroke-amber-400" />
    </Wrapper>
  );
}

/** No locations: a map pin with a dashed path. */
export function NoLocationsIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      <circle cx="60" cy="60" r="50" fill="var(--color-brand-100)" opacity="0.5" className="dark:opacity-20" />
      {/* Dashed path */}
      <path
        d="M25 85 Q40 70 55 78 T90 65"
        stroke="var(--color-brand-400)"
        strokeWidth="2"
        strokeDasharray="3 5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Map pin (empty) */}
      <path
        d="M60 30 C50 30 43 37 43 47 C43 60 60 78 60 78 C60 78 77 60 77 47 C77 37 70 30 60 30 Z"
        fill="var(--color-brand-500)"
        opacity="0.15"
      />
      <path
        d="M60 30 C50 30 43 37 43 47 C43 60 60 78 60 78 C60 78 77 60 77 47 C77 37 70 30 60 30 Z"
        stroke="var(--color-brand-600)"
        strokeWidth="2"
        className="dark:stroke-brand-400"
      />
      <circle cx="60" cy="47" r="6" fill="var(--color-brand-600)" className="dark:fill-brand-400" />
      {/* Small dots along path */}
      <circle cx="25" cy="85" r="2.5" fill="var(--color-brand-400)" opacity="0.6" />
      <circle cx="90" cy="65" r="2.5" fill="var(--color-brand-400)" opacity="0.6" />
    </Wrapper>
  );
}

/** All items have images: a photo frame with a checkmark. */
export function AllHaveImagesIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      <circle cx="60" cy="60" r="50" fill="#dcfce7" opacity="0.4" className="dark:opacity-15" />
      {/* Photo frame */}
      <rect x="35" y="38" width="50" height="38" rx="6" fill="#22c55e" opacity="0.12" className="dark:fill-green-600" />
      <rect x="35" y="38" width="50" height="38" rx="6" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="dark:stroke-green-500" />
      {/* Mountain + sun inside frame */}
      <circle cx="50" cy="50" r="5" fill="#fbbf24" opacity="0.6" className="dark:fill-amber-500" />
      <path d="M38 72 L52 58 L62 68 L72 54 L82 72 Z" fill="#22c55e" opacity="0.25" className="dark:fill-green-600" />
      {/* Checkmark badge */}
      <circle cx="78" cy="78" r="12" fill="#22c55e" opacity="0.9" className="dark:fill-green-600" />
      <path d="M73 78 L77 82 L84 75" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Wrapper>
  );
}

/** No items in category: a tag/filter with nothing inside. */
export function NoCategoryMatchIllustration({ className }: IllustrationProps) {
  return (
    <Wrapper className={className}>
      <circle cx="60" cy="60" r="50" fill="var(--color-brand-100)" opacity="0.5" className="dark:opacity-20" />
      {/* Tag shape */}
      <path
        d="M40 45 L68 45 L82 60 L68 75 L40 75 Z"
        fill="var(--color-brand-500)"
        opacity="0.12"
      />
      <path
        d="M40 45 L68 45 L82 60 L68 75 L40 75 Z"
        stroke="var(--color-brand-600)"
        strokeWidth="2"
        strokeLinejoin="round"
        className="dark:stroke-brand-400"
      />
      {/* Hole in tag */}
      <circle cx="48" cy="60" r="3" fill="var(--color-brand-600)" className="dark:fill-brand-400" />
      {/* Empty lines inside tag */}
      <line x1="56" y1="56" x2="72" y2="56" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="56" y1="64" x2="68" y2="64" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
    </Wrapper>
  );
}
