import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
  children: ReactNode;
  /** Hide the FAB on certain pages (e.g. add/edit). */
  hideFab?: boolean;
  /** Bottom padding for fixed nav on mobile. */
  padBottom?: boolean;
}

export function AppLayout({ children, hideFab, padBottom = true }: AppLayoutProps) {
  return (
    <div
      className="bg-app text-app"
      style={{ minHeight: '100dvh' }}
    >
      <main className={`mx-auto max-w-3xl px-4 sm:px-6 pt-5 safe-top ${padBottom ? 'pb-28 sm:pb-12' : ''}`}>
        {children}
      </main>

      {!hideFab && (
        <Link
          to="/add"
          className="fixed bottom-20 left-4 sm:bottom-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-600 text-white elev-lg hover:bg-brand-700 transition-colors focus-visible:outline-brand-500 safe-bottom anim-scale-in"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="إضافة غرض"
          title="إضافة غرض"
        >
          <Plus className="w-7 h-7" />
        </Link>
      )}

      <BottomNavigation />
    </div>
  );
}
