import { useEffect, useState } from 'react';
import { moveItem } from '../../services/items/itemService';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { StoredItem } from '../../types';
import { LocationInput } from '../common/LocationInput';

interface MoveItemSheetProps {
  open: boolean;
  item: StoredItem | null;
  onDone: (updated: StoredItem) => void;
  onClose: () => void;
}

export function MoveItemSheet({ open, item, onDone, onClose }: MoveItemSheetProps) {
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus trap + Escape + restore focus to the trigger element.
  const ref = useFocusTrap(open && !!item, { onEscape: onClose });

  useEffect(() => {
    if (open) {
      setLocation('');
      setError(null);
    }
  }, [open]);

  if (!open || !item) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setError(null);
    const trimmed = location.trim();
    if (!trimmed) {
      setError('المكان الجديد مطلوب.');
      return;
    }
    setBusy(true);
    try {
      const updated = await moveItem(item.id, trimmed);
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر نقل الغرض.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="نقل الغرض"
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-surface text-app w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 border border-app shadow-xl safe-bottom outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-sm text-muted">تغيير المكان</div>
        <h2 className="text-lg font-bold mb-1 truncate">{item.name}</h2>
        <p className="text-sm text-muted mb-4">
          من: <span className="text-app font-medium">{item.location}</span>
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-app">أين وضعته الآن؟</label>
          <LocationInput value={location} onChange={setLocation} placeholder="المكان الجديد" />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-surface-muted text-app border border-app"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              حفظ المكان
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
