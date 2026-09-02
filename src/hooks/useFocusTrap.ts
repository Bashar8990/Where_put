import { useEffect, useRef, type RefObject } from 'react';

/**
 * Traps keyboard focus inside a container element while the dialog/sheet is
 * open, and restores focus to the previously-focused element on cleanup.
 *
 * - Saves `document.activeElement` at mount, restores it at unmount.
 * - On Tab/Shift+Tab, focus loops within the container's tabbable elements.
 * - Calls `onEscape` when Escape is pressed.
 *
 * Usage:
 *   const ref = useFocusTrap(open, { onEscape: () => setOpen(false) });
 *   <div ref={ref}> ... </div>
 *
 * The hook returns a ref to attach to the container. Pass `active` so the
 * trap only engages when the dialog is actually open (avoids stealing focus
 * when the component is mounted but hidden).
 */
export function useFocusTrap(
  active: boolean,
  { onEscape }: { onEscape?: () => void } = {},
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<Element | null>(null);
  // Keep the latest onEscape in a ref so the effect doesn't re-run (and
  // re-focus the first element) when the parent re-renders with a new
  // inline callback. Re-running the effect on every keystroke would steal
  // focus from the currently-focused input, closing the mobile keyboard.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement;

    const container = ref.current;
    if (!container) return;

    // Focus the first tabbable element (or the container itself) on open.
    const tabbables = getTabbables(container);
    const initial =
      tabbables.find((el) => el.dataset.autofocus === 'true') ??
      tabbables[0] ??
      container;
    // Defer one frame so the browser has painted the dialog.
    const raf = requestAnimationFrame(() => initial.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const current = ref.current;
      if (!current) return;
      const items = getTabbables(current);
      if (items.length === 0) {
        e.preventDefault();
        current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !current.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to the trigger element.
      const prev = previouslyFocused.current;
      if (prev instanceof HTMLElement && document.contains(prev)) {
        prev.focus();
      }
    };
    // Only re-run when `active` toggles — NOT when onEscape changes identity.
  }, [active]);

  return ref;
}

function getTabbables(root: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}
