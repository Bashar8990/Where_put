import { Home, MapPinned, Settings, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { countFavorites } from '../../services/items/itemService';

const items = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/locations', label: 'الأماكن', icon: MapPinned, end: false },
  { to: '/favorites', label: 'المفضلة', icon: Star, end: false, badge: true },
  { to: '/settings', label: 'الإعدادات', icon: Settings, end: false },
];

export function BottomNavigation() {
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const n = await countFavorites();
      if (!cancelled) setFavCount(n);
    }
    void load();
    // Re-check when the page becomes visible again (user may have
    // toggled favorites in another page then navigated back).
    const onVis = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-app safe-bottom sm:hidden"
      aria-label="التنقل الرئيسي"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-all duration-200 ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-muted hover:text-app'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator: a small dot/bar above the icon */}
                    <span
                      className={`absolute top-0 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400 transition-all duration-200 ${
                        isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                    <span className="relative">
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'scale-110' : 'scale-100'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {/* Favorites badge */}
                      {it.badge && favCount > 0 && (
                        <span
                          className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-surface"
                          aria-label={`${favCount} مفضلة`}
                        >
                          {favCount > 99 ? '٩٩+' : favCount}
                        </span>
                      )}
                    </span>
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
