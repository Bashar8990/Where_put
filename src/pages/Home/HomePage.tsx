import { Plus, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FirstRunIllustration,
  NoResultsIllustration,
  AllHaveImagesIllustration,
  NoCategoryMatchIllustration,
} from '../../components/common/Illustrations';
import { TopBar } from '../../components/common/TopBar';
import { ItemCard } from '../../components/items/ItemCard';
import { MoveItemSheet } from '../../components/items/MoveItemSheet';
import { SearchBar } from '../../components/search/SearchBar';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  recentItems,
  searchItems,
  type SearchFilters,
} from '../../services/search/searchService';
import {
  countItems,
  purgeDeletedItems,
  restoreItem,
  softDeleteItem,
  toggleFavorite,
} from '../../services/items/itemService';
import { CATEGORY_LABELS, CATEGORY_ORDER, type ItemCategory, type StoredItem } from '../../types';
import { haptic } from '../../utils/haptics';
import { useBackupReminder } from '../../hooks/useBackupReminder';

type FilterTab = 'all' | 'recent' | 'noImage';

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  useBackupReminder();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 180);
  const [tab, setTab] = useState<FilterTab>('all');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<StoredItem[]>([]);
  const [recent, setRecent] = useState<StoredItem[]>([]);
  // Single source of truth for "does the database have ANY items at all?"
  //   null  = loading (not yet determined)
  //   true  = database has at least one item
  //   false = database is completely empty (first-run)
  // This is NOT re-derived per-tab; it reflects total DB state only.
  const [hasAny, setHasAny] = useState<boolean | null>(null);
  // `loading` = first-ever load (no data yet) → show full loading state.
  // `refreshing` = subsequent background updates (tab/category/query changes)
  //   → keep existing data visible, no flicker.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [moveTarget, setMoveTarget] = useState<StoredItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredItem | null>(null);

  async function refresh() {
    const [rec, total] = await Promise.all([recentItems(8), countItems()]);
    setRecent(rec);
    setHasAny(total > 0);
  }

  async function runSearch() {
    // Only the very first load shows a full loading state.
    // All subsequent updates keep the existing data visible to avoid flicker.
    if (!loading) setRefreshing(true);
    try {
      const filters: SearchFilters = {
        withoutImage: tab === 'noImage',
        recentlyUpdated: tab === 'recent' && !debounced,
        category,
      };
      const res = await searchItems(debounced, filters);
      setResults(res.map((r) => r.item));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Initial load + refresh on tab/category change.
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, tab, category]);

  const isSearching = debounced.trim().length > 0;

  async function handleToggleFavorite(id: string) {
    await toggleFavorite(id);
    await refresh();
    await runSearch();
    haptic('light');
  }

  async function handleMoveDone() {
    setMoveTarget(null);
    await refresh();
    await runSearch();
    showToast({ message: 'تم تحديث مكان الغرض' });
    haptic('success');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await softDeleteItem(target.id);
    await refresh();
    await runSearch();
    haptic('error');
    const toastId = showToast({
      message: `تم حذف "${target.name}"`,
      actionLabel: 'تراجع',
      onAction: async () => {
        await restoreItem(target.id);
        await refresh();
        await runSearch();
        showToast({ message: 'تمت الاستعادة' });
        haptic('success');
      },
      duration: 6000,
    });
    // After undo window, purge.
    window.setTimeout(async () => {
      await purgeDeletedItems();
    }, 7000);
    void toastId;
  }

  const visibleItems = isSearching ? results : tab === 'recent' ? recent : results;

  return (
    <AppLayout>
      <TopBar
        title="وين حطيته؟"
        showSettings
        right={
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 radius-sm text-app hover:bg-app/5"
            aria-label="فلاتر"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        }
      />

      <SearchBar value={query} onChange={setQuery} autoFocus={!hasAny} />

      {/* Filter tabs */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <FilterChip active={tab === 'all'} onClick={() => setTab('all')}>
          الكل
        </FilterChip>
        <FilterChip active={tab === 'recent'} onClick={() => setTab('recent')}>
          آخر تحديث
        </FilterChip>
        <FilterChip active={tab === 'noImage'} onClick={() => setTab('noImage')}>
          بدون صورة
        </FilterChip>
      </div>

      {showFilters && (
        <div className="mt-3 bg-surface border border-app radius-lg elev-card p-3">
          <div className="text-sm font-semibold text-app mb-2">التصنيف</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                category === null
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-surface text-app border-app'
              }`}
            >
              الكل
            </button>
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  category === c
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-surface text-app border-app'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-4 space-y-4 transition-opacity duration-150 ${
          refreshing ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {loading ? (
          <p className="text-center text-muted py-8 text-sm">جارٍ التحميل…</p>
        ) : visibleItems.length === 0 ? (
          isSearching ? (
            <EmptyState
              icon={<NoResultsIllustration />}
              title="لم نجد شيئًا بهذا الاسم"
              description={`لا توجد نتائج لبحثك "${debounced}".`}
              actionLabel="+ إضافة غرض جديد"
              onAction={() => navigate(`/add?name=${encodeURIComponent(debounced)}`)}
            />
          ) : hasAny === false ? (
            // Database is completely empty → first-run welcome state.
            <EmptyState
              icon={<FirstRunIllustration />}
              title="لم تسجل أي شيء بعد"
              description="في المرة القادمة التي تضع فيها شيئًا مهمًا في مكان ما، سجّله هنا حتى تعرف أين تجده لاحقًا."
              actionLabel="+ أضف أول غرض"
              onAction={() => navigate('/add')}
              secondary={
                <div className="text-xs text-muted">
                  أمثلة: جواز السفر · المفتاح الاحتياطي · ضمان الجهاز · USB
                </div>
              }
            />
          ) : tab === 'noImage' ? (
            // DB has items but all have images.
            <EmptyState
              icon={<AllHaveImagesIllustration />}
              title="كل الأغراض لها صور"
              description="ستظهر هنا الأغراض التي لم ترفق لها صورة عند الإضافة."
            />
          ) : (
            <EmptyState
              icon={<NoCategoryMatchIllustration />}
              title="لا توجد عناصر في هذا التصنيف"
              description="جرّب تصنيفاً آخر أو أضف غرضاً جديداً في هذا التصنيف."
            />
          )
        ) : (
          visibleItems.map((item, i) => (
            <div
              key={item.id}
              className="anim-card-enter"
              style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
            >
              <ItemCard
                item={item}
                onToggleFavorite={handleToggleFavorite}
                onMove={setMoveTarget}
                onDelete={setDeleteTarget}
                highlight={isSearching ? debounced : undefined}
              />
            </div>
          ))
        )}
      </div>

      <MoveItemSheet
        open={!!moveTarget}
        item={moveTarget}
        onDone={handleMoveDone}
        onClose={() => setMoveTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`حذف "${deleteTarget?.name ?? ''}"؟`}
        description="سيتم حذف بيانات الغرض وصورته من هذا الجهاز. يمكنك التراجع خلال لحظات."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-surface text-muted border-app hover:text-app'
      }`}
    >
      {children}
    </button>
  );
}

// silence unused import in some build configs
void Plus;
