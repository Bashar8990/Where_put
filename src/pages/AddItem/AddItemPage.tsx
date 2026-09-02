import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { TopBar } from '../../components/common/TopBar';
import { ItemForm, type ItemFormValues } from '../../components/items/ItemForm';
import { useToast } from '../../components/common/Toast';
import { createItem } from '../../services/items/itemService';
import { haptic } from '../../utils/haptics';

export function AddItemPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const prefillName = params.get('name') ?? '';

  async function handleSubmit(values: ItemFormValues) {
    const item = await createItem({
      name: values.name,
      location: values.location,
      notes: values.notes,
      category: values.category,
      isFavorite: values.isFavorite,
      imageId: values.imageId,
    });
    showToast({ message: 'تم حفظ مكان الغرض' });
    haptic('success');
    navigate(`/item/${item.id}`, { replace: true });
  }

  return (
    <AppLayout hideFab padBottom>
      <TopBar title="إضافة غرض" showBack backTo="/" />
      <ItemForm
        initial={{ name: prefillName }}
        submitLabel="حفظ"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </AppLayout>
  );
}
