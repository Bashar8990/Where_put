import { Home, MapPinned, Settings, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/locations', label: 'الأماكن', icon: MapPinned, end: false },
  { to: '/favorites', label: 'المفضلة', icon: Star, end: false },
  { to: '/settings', label: 'الإعدادات', icon: Settings, end: false },
];

export function BottomNavigation() {
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
                  `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors ${
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-muted'
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
                <span>{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
