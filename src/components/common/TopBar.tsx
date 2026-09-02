import { ArrowRight, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: ReactNode;
  showBack?: boolean;
  backTo?: string;
  showSettings?: boolean;
  right?: ReactNode;
}

export function TopBar({ title, showBack, backTo, showSettings, right }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-2 mb-4">
      {showBack && (
        <button
          type="button"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="p-2 rounded-lg text-app hover:bg-app/5"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-app flex-1 min-w-0 truncate">{title}</h1>
      {right}
      {showSettings && (
        <Link
          to="/settings"
          className="p-2 rounded-lg text-app hover:bg-app/5"
          aria-label="الإعدادات"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}
    </header>
  );
}
