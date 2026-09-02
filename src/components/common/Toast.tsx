import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (t: Omit<Toast, 'id'>) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId++;
      const toast: Toast = { id, duration: 3500, ...t };
      setToasts((prev) => [...prev, toast]);
      if (toast.duration && toast.duration > 0) {
        window.setTimeout(() => dismissToast(id), toast.duration);
      }
      return id;
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 safe-bottom"
      role="region"
      aria-label="الإشعارات"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-surface text-app elev-md border border-app radius-md px-4 py-3 max-w-md w-full flex items-center justify-between gap-3 anim-slide-up"
          role="status"
        >
          <span className="text-sm leading-relaxed">{t.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline"
                onClick={() => {
                  t.onAction?.();
                  onDismiss(t.id);
                }}
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              className="text-muted hover:text-app min-w-[36px] min-h-[36px] flex items-center justify-center p-1 radius-sm"
              aria-label="إغلاق"
              onClick={() => onDismiss(t.id)}
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
