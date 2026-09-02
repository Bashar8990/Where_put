import { CATEGORY_LABELS, CATEGORY_ORDER, type ItemCategory } from '../../types';

interface CategoryPickerProps {
  value: ItemCategory | null;
  onChange: (v: ItemCategory | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
          value === null
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-surface text-app border-app hover:border-brand-400'
        }`}
      >
        بدون تصنيف
      </button>
      {CATEGORY_ORDER.map((cat) => {
        const active = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface text-app border-app hover:border-brand-400'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
}
