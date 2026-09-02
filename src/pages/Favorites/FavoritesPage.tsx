import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/common/AppLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { TopBar } from '../../components/common/TopBar';
import { ItemCard } from '../../components/items/ItemCard';
import { MoveItemSheet } from '../../components/items/MoveItemSheet';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import {
  permanentlyDeleteItem,
  purgeDeletedItems,
  restoreItem,
  softDeleteItem,
  toggleFavorite,
} from '../../services/items/itemService';
import { favoriteItems } from '../../services/search/searchService';
import type { StoredItem } from '../../types';

export function FavoritesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<StoredItem[]>([]);
  const [moveTarget, setMoveTarget] = useState<StoredItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredItem | null>(null);

  async function load() {
    setItems(await favoriteItems());
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleToggleFavorite(id: string) {
    await toggleFavorite(id);
    await load();
  }

  async function handleMoveDone() {
    setMoveTarget(null);
    await load();
    showToast({ message: 'تم تحديث مكان الغرض' });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await softDeleteItem(target.id);
    await load();
    showToast({
      message: `تم حذف "${target.name}"`,
      actionLabel: 'تراجع',
      onAction: async () => {
        await restoreItem(target.id);
        await load();
        showToast({ message: 'تمت الاستعادة' });
      },
      duration: 6000,
    });
    window.setTimeout(async () => {
      await purgeDeletedItems();
    }, 7000);
  }

  return (
    <AppLayout>
      <TopBar title="المفضلة" showSettings />
      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            icon={<Star className="w-12 h-12" strokeWidth={1.5} />}
            title="لا توجد مفضلات"
            description="اضغط على نجمة الغرض لإضافته إلى المفضلة للوصول السريع."
          />
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleFavorite={handleToggleFavorite}
              onMove={setMoveTarget}
              onDelete={setDeleteTarget}
            />
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

void permanentlyDeleteItem;
