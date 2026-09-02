import { Plus, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondary,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="mb-4">
        {icon ?? <SearchX className="w-12 h-12 text-muted" strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-bold text-app mb-2">{title}</h3>
      {description && <p className="text-muted text-sm leading-relaxed max-w-sm mb-6">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 radius-md text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
      {secondary && <div className="mt-6">{secondary}</div>}
    </div>
  );
}
