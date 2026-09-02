import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { TopBar } from '../../components/common/TopBar';
import { ItemForm, type ItemFormValues } from '../../components/items/ItemForm';
import { useToast } from '../../components/common/Toast';
import { getItem, updateItem } from '../../services/items/itemService';
import type { StoredItem } from '../../types';
import { haptic } from '../../utils/haptics';

export function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [item, setItem] = useState<StoredItem | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  // Active flag to prevent stale fetch results from overwriting newer state.
  const loadSeq = useRef(0);

  useEffect(() => {
    if (!id) return;
    const seq = ++loadSeq.current;
    getItem(id).then((it) => {
      if (seq !== loadSeq.current) return; // stale
      setItem(it ?? null);
    });
  }, [id]);

  if (item === undefined) {
    return (
      <AppLayout hideFab>
        <TopBar title="تعديل الغرض" showBack />
        <p className="text-muted text-sm text-center py-8">جارٍ التحميل…</p>
      </AppLayout>
    );
  }

  if (item === null) {
    return (
      <AppLayout hideFab>
        <TopBar title="تعديل الغرض" showBack />
        <p className="text-muted text-sm text-center py-8">الغرض غير موجود.</p>
      </AppLayout>
    );
  }

  async function handleSubmit(values: ItemFormValues) {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateItem(id, {
        name: values.name,
        location: values.location,
        notes: values.notes,
        category: values.category,
        isFavorite: values.isFavorite,
        imageId: values.imageId,
      });
      showToast({ message: 'تم حفظ التعديلات' });
      haptic('success');
      navigate(`/item/${id}`, { replace: true });
    } catch (err) {
      setSubmitting(false);
      throw err;
    }
  }

  return (
    <AppLayout hideFab padBottom>
      <TopBar title="تعديل الغرض" showBack backTo={`/item/${id}`} />
      <ItemForm
        initial={{
          name: item.name,
          location: item.location,
          notes: item.notes,
          category: item.category,
          isFavorite: item.isFavorite,
          imageId: item.imageId,
        }}
        submitLabel="حفظ التعديلات"
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </AppLayout>
  );
}
