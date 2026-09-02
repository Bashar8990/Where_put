import type { ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Focus trap + Escape + restore focus to the trigger element.
  const ref = useFocusTrap(open, { onEscape: onCancel });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-surface text-app radius-lg elev-lg max-w-sm w-full p-5 border border-app outline-none anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold mb-2">
          {title}
        </h2>
        {description && <div className="text-muted text-sm leading-relaxed mb-5">{description}</div>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 radius-sm text-sm font-medium bg-surface-muted text-app border border-app hover:bg-app/5"
            onClick={onCancel}
            // For destructive actions, focus the safe (cancel) button first so
            // an accidental Enter/Space does not confirm the dangerous action.
            // For non-destructive confirms, keep focus on the primary action.
            data-autofocus={danger ? 'true' : undefined}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 radius-sm text-sm font-semibold text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
            onClick={onConfirm}
            data-autofocus={!danger ? 'true' : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
