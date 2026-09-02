import { MapPin, MoreVertical, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, type StoredItem } from '../../types';
import { formatRelativeDate } from '../../utils/dates';
import { ItemImage } from '../common/ItemImage';

interface ItemCardProps {
  item: StoredItem;
  onToggleFavorite: (id: string) => void;
  onMove: (item: StoredItem) => void;
  onDelete: (item: StoredItem) => void;
}

export function ItemCard({ item, onToggleFavorite, onMove, onDelete }: ItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-surface border border-app rounded-2xl p-3 sm:p-4 hover:border-brand-300 transition-colors">
      <div className="flex gap-3">
        <Link
          to={`/item/${item.id}`}
          className="shrink-0"
          aria-label={`عرض تفاصيل ${item.name}`}
        >
          {item.imageId ? (
            <ItemImage
              imageId={item.imageId}
              alt={item.name}
              maxWidth={72}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-surface-muted"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-muted flex items-center justify-center text-muted">
              <MapPin className="w-6 h-6" strokeWidth={1.5} />
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/item/${item.id}`} className="min-w-0">
              <h3 className="font-bold text-app text-base sm:text-lg truncate flex items-center gap-1.5">
                {item.name}
                {item.isFavorite && <Star className="w-4 h-4 text-amber-400" fill="currentColor" />}
              </h3>
            </Link>
            <div className="relative shrink-0">
              <button
                type="button"
                className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-app/5"
                aria-label="إجراءات"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute left-0 mt-1 z-30 bg-surface border border-app rounded-xl shadow-lg py-1 min-w-[140px]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-right px-3 py-2 text-sm hover:bg-surface-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onMove(item);
                      }}
                    >
                      نقل
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-right px-3 py-2 text-sm hover:bg-surface-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleFavorite(item.id);
                      }}
                    >
                      {item.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    </button>
                    <Link
                      to={`/item/${item.id}/edit`}
                      role="menuitem"
                      className="block px-3 py-2 text-sm hover:bg-surface-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      تعديل
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-right px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-surface-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(item);
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Link to={`/item/${item.id}`} className="block mt-1">
            <p className="text-app text-sm sm:text-base font-semibold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </p>
          </Link>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-muted text-muted border border-app">
                {CATEGORY_LABELS[item.category]}
              </span>
            )}
            <span className="text-xs text-muted">آخر تحديث: {formatRelativeDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
