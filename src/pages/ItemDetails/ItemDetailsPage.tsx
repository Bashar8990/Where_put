import { MapPin, Pencil, Trash2, MoveRight, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Lightbox } from '../../components/common/Lightbox';
import { TopBar } from '../../components/common/TopBar';
import { useToast } from '../../components/common/Toast';
import { ItemImage } from '../../components/common/ItemImage';
import { LocationHistory } from '../../components/items/LocationHistory';
import { MoveItemSheet } from '../../components/items/MoveItemSheet';
import {
  getItem,
  permanentlyDeleteItem,
  purgeDeletedItems,
  restoreItem,
  softDeleteItem,
  toggleFavorite,
} from '../../services/items/itemService';
import { CATEGORY_LABELS, type StoredItem } from '../../types';
import { formatFullDate } from '../../utils/dates';

export function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [item, setItem] = useState<StoredItem | null | undefined>(undefined);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  async function load() {
    if (!id) return;
    const it = await getItem(id);
    setItem(it ?? null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (item === undefined) {
    return (
      <AppLayout hideFab>
        <TopBar title="تفاصيل الغرض" showBack />
        <p className="text-muted text-sm text-center py-8">جارٍ التحميل…</p>
      </AppLayout>
    );
  }

  if (item === null) {
    return (
      <AppLayout hideFab>
        <TopBar title="تفاصيل الغرض" showBack />
        <p className="text-muted text-sm text-center py-8">الغرض غير موجود.</p>
      </AppLayout>
    );
  }

  async function handleFavorite() {
    if (!item) return;
    await toggleFavorite(item.id);
    await load();
  }

  async function handleMoveDone() {
    setMoveOpen(false);
    await load();
    showToast({ message: 'تم تحديث مكان الغرض' });
  }

  async function handleDelete() {
    if (!item) return;
    const target = item;
    setConfirmDelete(false);
    await softDeleteItem(target.id);
    const toastId = showToast({
      message: `تم حذف "${target.name}"`,
      actionLabel: 'تراجع',
      onAction: async () => {
        await restoreItem(target.id);
        showToast({ message: 'تمت الاستعادة' });
        await load();
      },
      duration: 6000,
    });
    window.setTimeout(async () => {
      await purgeDeletedItems();
    }, 7000);
    void toastId;
    navigate('/', { replace: true });
  }

  return (
    <AppLayout hideFab>
      <TopBar
        title={item.name}
        showBack
        backTo="/"
        right={
          <button
            type="button"
            onClick={handleFavorite}
            className="p-2 rounded-lg hover:bg-app/5"
            aria-label={item.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            aria-pressed={item.isFavorite}
          >
            <Star
              className={item.isFavorite ? 'text-amber-400' : 'text-muted'}
              fill={item.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        }
      />

      <div className="space-y-4">
        {/* Image */}
        {item.imageId && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block w-full rounded-2xl overflow-hidden border border-app bg-surface-muted"
            aria-label="عرض الصورة بحجم أكبر"
          >
            <ItemImage
              imageId={item.imageId}
              alt={item.name}
              className="w-full max-h-80 object-cover"
            />
          </button>
        )}

        {/* Current location — most prominent */}
        <section className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl p-4">
          <div className="text-sm text-brand-700 dark:text-brand-300 font-semibold mb-1">
            المكان الحالي
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
            <p className="text-app text-lg font-bold leading-snug">{item.location}</p>
          </div>
        </section>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMoveOpen(true)}
            className="flex flex-col items-center gap-1 bg-surface border border-app rounded-xl py-3 hover:border-brand-400"
          >
            <MoveRight className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="text-xs">تغيير المكان</span>
          </button>
          <Link
            to={`/item/${item.id}/edit`}
            className="flex flex-col items-center gap-1 bg-surface border border-app rounded-xl py-3 hover:border-brand-400"
          >
            <Pencil className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="text-xs">تعديل</span>
          </Link>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex flex-col items-center gap-1 bg-surface border border-app rounded-xl py-3 hover:border-red-400 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-xs">حذف</span>
          </button>
        </div>

        {/* Notes */}
        {item.notes && (
          <section className="bg-surface border border-app rounded-2xl p-4">
            <div className="text-sm font-semibold text-app mb-1">ملاحظات</div>
            <p className="text-app text-sm leading-relaxed whitespace-pre-wrap">{item.notes}</p>
          </section>
        )}

        {/* Category */}
        {item.category && (
          <section className="bg-surface border border-app rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-app">التصنيف</span>
            <span className="text-sm px-2.5 py-1 rounded-full bg-surface-muted border border-app text-app">
              {CATEGORY_LABELS[item.category]}
            </span>
          </section>
        )}

        {/* Dates */}
        <section className="bg-surface border border-app rounded-2xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">تاريخ الإضافة</span>
            <span className="text-app">{formatFullDate(item.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">آخر تحديث</span>
            <span className="text-app">{formatFullDate(item.updatedAt)}</span>
          </div>
        </section>

        {/* Location history */}
        <LocationHistory item={item} />
      </div>

      <MoveItemSheet
        open={moveOpen}
        item={item}
        onDone={handleMoveDone}
        onClose={() => setMoveOpen(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`حذف "${item.name}"؟`}
        description="سيتم حذف بيانات الغرض وصورته من هذا الجهاز. يمكنك التراجع خلال لحظات."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <Lightbox
        open={lightbox}
        imageId={item.imageId}
        alt={item.name}
        onClose={() => setLightbox(false)}
      />
    </AppLayout>
  );
}

// silence unused import warnings
void permanentlyDeleteItem;
