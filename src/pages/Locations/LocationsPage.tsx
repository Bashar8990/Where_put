import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { TopBar } from '../../components/common/TopBar';
import { listLocations } from '../../services/items/itemService';
import { itemsAtLocation } from '../../services/search/searchService';
import type { StoredItem } from '../../types';

export function LocationsPage() {
  const [locations, setLocations] = useState<{ location: string; count: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<StoredItem[]>([]);

  useEffect(() => {
    listLocations().then(setLocations);
  }, []);

  useEffect(() => {
    if (selected) itemsAtLocation(selected).then(setItems);
  }, [selected]);

  if (selected) {
    return (
      <AppLayout>
        <TopBar title="الأماكن" showBack backTo="/locations" />
        <div className="mb-4 bg-surface border border-app rounded-2xl p-4">
          <div className="text-sm text-muted">المكان</div>
          <div className="text-app font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            {selected}
          </div>
          <div className="text-xs text-muted mt-1">{items.length} غرض</div>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">لا توجد أغراض في هذا المكان.</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="block bg-surface border border-app rounded-2xl p-4 hover:border-brand-300"
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
      <div className="space-y-2">
        {locations.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-12 h-12" strokeWidth={1.5} />}
            title="لا توجد أماكن بعد"
            description="ستظهر هنا الأماكن التي تسجّلها عند إضافة الأغراض."
          />
        ) : (
          locations.map((l) => (
            <button
              key={l.location}
              type="button"
              onClick={() => setSelected(l.location)}
              className="w-full text-right bg-surface border border-app rounded-2xl p-4 flex items-center justify-between hover:border-brand-300"
            >
              <span className="flex items-center gap-2 text-app font-medium">
                <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                {l.location}
              </span>
              <span className="text-sm text-muted">{l.count} غرض</span>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
