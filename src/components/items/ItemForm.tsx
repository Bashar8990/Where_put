import { Save, Star } from 'lucide-react';
import { useState } from 'react';
import type { ItemCategory, StoredItem } from '../../types';
import { CategoryPicker } from '../common/CategoryPicker';
import { ImagePicker } from '../common/ImagePicker';
import { LocationInput } from '../common/LocationInput';

export interface ItemFormValues {
  name: string;
  location: string;
  notes: string;
  category: ItemCategory | null;
  isFavorite: boolean;
  imageId: string | null;
}

interface ItemFormProps {
  initial?: Partial<ItemFormValues>;
  submitLabel?: string;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  /** When editing, the previous imageId so we can clean up if replaced. */
  previousImageId?: string | null;
}

export function ItemForm({
  initial,
  submitLabel = 'حفظ',
  onSubmit,
  onCancel,
  submitting,
}: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [category, setCategory] = useState<ItemCategory | null>(initial?.category ?? null);
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [imageId, setImageId] = useState<string | null>(initial?.imageId ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    if (!trimmedName) {
      setError('اسم الغرض مطلوب.');
      return;
    }
    if (!trimmedLocation) {
      setError('المكان مطلوب.');
      return;
    }
    try {
      await onSubmit({
        name: trimmedName,
        location: trimmedLocation,
        notes: notes.trim(),
        category,
        isFavorite,
        imageId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="اسم الغرض" required htmlFor="item-name">
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ما الشيء الذي تريد تذكر مكانه؟"
          required
          autoFocus
          className="w-full bg-surface text-app border border-app rounded-xl px-4 py-3 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
        />
      </Field>

      <Field label="المكان" required htmlFor="item-location">
        <LocationInput
          id="item-location"
          value={location}
          onChange={setLocation}
          required
        />
      </Field>

      <Field label="الصورة" htmlFor="item-image">
        <ImagePicker imageId={imageId} onImageChange={setImageId} />
      </Field>

      <Field label="الملاحظات" htmlFor="item-notes">
        <textarea
          id="item-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل تساعدك لاحقًا؟"
          rows={3}
          className="w-full bg-surface text-app border border-app rounded-xl px-4 py-3 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition resize-y"
        />
      </Field>

      <Field label="التصنيف">
        <CategoryPicker value={category} onChange={setCategory} />
      </Field>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFavorite((v) => !v)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
            isFavorite
              ? 'border-amber-400 text-amber-500 bg-amber-50/50 dark:bg-amber-500/10'
              : 'border-app text-muted hover:text-app'
          }`}
          aria-pressed={isFavorite}
        >
          <Star
            className="w-4 h-4"
            fill={isFavorite ? 'currentColor' : 'none'}
            strokeWidth={1.8}
          />
          {isFavorite ? 'في المفضلة' : 'إضافة إلى المفضلة'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-app pb-2 safe-bottom -mx-4 px-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium bg-surface-muted text-app border border-app hover:bg-app/5"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-app">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export type { StoredItem };
