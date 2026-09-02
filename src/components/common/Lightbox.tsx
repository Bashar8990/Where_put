import { X } from 'lucide-react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ItemImage } from './ItemImage';

interface LightboxProps {
  open: boolean;
  imageId: string | null;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer with:
 * - Focus trap + Escape to close + focus restoration.
 * - Swipe-up / swipe-down / swipe-horizontal to dismiss (mobile gesture).
 * - Click on backdrop to close.
 * - Lucide X icon for the close button (visual consistency).
 */
export function Lightbox({ open, imageId, alt, onClose }: LightboxProps) {
  const ref = useFocusTrap(open, { onEscape: onClose });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (!open || !imageId) return null;

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - start.x);
    const dy = t.clientY - start.y;
    // Dismiss on a decisive swipe in any direction (vertical or horizontal).
    if (dy < -60 || dy > 60 || dx > 100) {
      onClose();
    }
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center p-4 outline-none"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="عرض الصورة"
    >
      <ItemImage
        imageId={imageId}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
      <button
        type="button"
        className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="إغلاق"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}
