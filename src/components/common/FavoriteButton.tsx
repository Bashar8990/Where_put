import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  active: boolean;
  size?: number;
  onChange: () => void;
  label?: string;
}

export function FavoriteButton({ active, size = 20, onChange, label }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange();
      }}
      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-app/5 transition-colors"
      aria-pressed={active}
      aria-label={label ?? (active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة')}
      title={active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Star
        className={active ? 'text-amber-400' : 'text-muted'}
        size={size}
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={1.8}
      />
    </button>
  );
}
