/**
 * Subtle haptic feedback for a native-app feel.
 *
 * Uses the Vibration API (`navigator.vibrate`), available on:
 * - Android Chrome (standalone and browser)
 * - iOS Safari 17.4+ (PWA standalone mode only)
 *
 * The call is a no-op on unsupported browsers (desktop, older iOS), so it is
 * always safe to invoke without feature-checking at the call site.
 *
 * Patterns are intentionally short (≤20ms) to feel like a gentle tap, not a
 * buzz. `prefers-reduced-motion` is respected to avoid sensory overload.
 */

type HapticPattern = 'light' | 'medium' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  // Single very short tap — generic feedback (save, toggle, select).
  light: 10,
  // Slightly stronger tap — confirmations, mode changes.
  medium: 20,
  // Two quick taps — successful action completed (saved, moved).
  success: [10, 40, 10],
  // Single medium tap — caution (undo available, destructive prompt opened).
  warning: 30,
  // Double strong tap — destructive action executed (delete, wipe).
  error: [20, 60, 20],
};

export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  // Respect reduced-motion users who may prefer no sensory feedback.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Some browsers throw if the page is not focused; ignore silently.
  }
}
