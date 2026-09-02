import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { NoLocationsIllustration } from '../../components/common/Illustrations';
import { TopBar } from '../../components/common/TopBar';
import { listLocations } from '../../services/items/itemService';
import { itemsAtLocation } from '../../services/search/searchService';
import type { StoredItem } from '../../types';
import { normalizeArabicText } from '../../utils/normalizeArabicText';

type SortMode = 'usage' | 'alpha';

const SORT_LABELS: Record<SortMode, string> = {
  usage: 'الأكثر استخدامًا',
  alpha: 'أبجدي',
};

export function LocationsPage() {
  const [locations, setLocations] = useState<{ location: string; count: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<StoredItem[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('usage');
  // Active flags to prevent stale results from overwriting newer state.
  const locSeq = useRef(0);
  const itemsSeq = useRef(0);

  useEffect(() => {
    const seq = ++locSeq.current;
    listLocations().then((locs) => {
      if (seq !== locSeq.current) return; // stale
      setLocations(locs);
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setItems([]);
      return;
    }
    const seq = ++itemsSeq.current;
    itemsAtLocation(selected).then((res) => {
      if (seq !== itemsSeq.current) return; // stale
      setItems(res);
    });
  }, [selected]);

  // Filter + sort locations client-side. listLocations already returns
  // usage-sorted, but we re-sort here so toggling sort mode is instant.
  const visible = useMemo(() => {
    const q = normalizeArabicText(query.trim());
    const filtered = q
      ? locations.filter((l) => normalizeArabicText(l.location).includes(q))
      : locations;
    const sorted = [...filtered].sort((a, b) =>
      sort === 'usage'
        ? b.count - a.count || a.location.localeCompare(b.location, 'ar')
        : a.location.localeCompare(b.location, 'ar'),
    );
    return sorted;
  }, [locations, query, sort]);

  if (selected) {
    return (
      <AppLayout>
        <TopBar title="الأماكن" showBack backTo="/locations" />
        <div className="mb-4 bg-surface border border-app radius-lg elev-card p-4">
          <div className="text-sm text-muted">المكان</div>
          <div className="text-app font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            {selected}
          </div>
          <div className="text-xs text-muted mt-1">{items.length} غرض</div>
        </div>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">لا توجد أغراض في هذا المكان.</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="block bg-surface border border-app radius-lg elev-card p-4 hover:border-brand-300"
              >
                <div className="font-bold text-app">{item.name}</div>
                <div className="text-sm text-muted mt-0.5">{item.location}</div>
              </Link>
            ))
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="الأماكن" showSettings />

      {locations.length > 0 && (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مكان…"
              aria-label="بحث عن مكان"
              className="w-full bg-surface text-app border border-app radius-lg pr-11 pl-10 py-3 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 radius-sm text-muted hover:text-app hover:bg-app/5"
                aria-label="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort toggle + result count */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-muted">
              {visible.length} مكان
              {query && visible.length !== locations.length ? ` من ${locations.length}` : ''}
            </span>
            <div className="flex gap-1.5">
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSort(mode)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    sort === mode
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-surface text-muted border-app hover:text-app'
                  }`}
                  aria-pressed={sort === mode}
                >
                  {SORT_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        {locations.length === 0 ? (
          <EmptyState
            icon={<NoLocationsIllustration />}
            title="لا توجد أماكن بعد"
            description="ستظهر هنا الأماكن التي تسجّلها عند إضافة الأغراض."
          />
        ) : visible.length === 0 ? (
          <p className="text-center text-muted py-8 text-sm">
            لا توجد أماكن مطابقة لبحثك.
          </p>
        ) : (
          visible.map((l) => (
            <button
              key={l.location}
              type="button"
              onClick={() => setSelected(l.location)}
              className="w-full text-right bg-surface border border-app radius-lg elev-card p-4 flex items-center justify-between hover:border-brand-300"
            >
              <span className="flex items-center gap-2 text-app font-medium min-w-0">
                <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate">{l.location}</span>
              </span>
              <span className="text-sm text-muted shrink-0">{l.count} غرض</span>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
