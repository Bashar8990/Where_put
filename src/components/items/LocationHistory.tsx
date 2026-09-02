import { ChevronDown, History } from 'lucide-react';
import { useState } from 'react';
import type { StoredItem } from '../../types';
import { formatFullDate } from '../../utils/dates';

export function LocationHistory({ item }: { item: StoredItem }) {
  const [open, setOpen] = useState(item.locationHistory.length <= 5);

  if (item.locationHistory.length === 0) {
    return null;
  }

  const entries = open ? item.locationHistory : item.locationHistory.slice(0, 3);

  return (
    <section className="bg-surface border border-app radius-lg elev-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-app font-semibold"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <History className="w-4 h-4 text-muted" />
          سجل الأماكن
          <span className="text-muted text-xs font-normal">({item.locationHistory.length})</span>
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <ol className="mt-3 space-y-3 border-r-2 border-app pr-3">
        <li className="relative">
          <span className="absolute -right-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-surface" />
          <div className="text-app font-medium text-sm">{item.location}</div>
          <div className="text-xs text-muted">المكان الحالي</div>
        </li>
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute -right-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-muted border-2 border-surface" />
            <div className="text-app text-sm">{entry.location}</div>
            <div className="text-xs text-muted">{formatFullDate(entry.createdAt)}</div>
          </li>
        ))}
      </ol>

      {!open && item.locationHistory.length > 3 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          عرض كل السجل ({item.locationHistory.length})
        </button>
      )}
    </section>
  );
}
