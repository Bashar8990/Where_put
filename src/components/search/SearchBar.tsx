import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'جواز السفر، المفتاح، USB…',
  autoFocus,
}: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="relative">
      <Search
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none"
        aria-hidden
      />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="بحث"
        className="w-full bg-surface text-app border border-app radius-lg pr-11 pl-10 py-3.5 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition placeholder:text-muted"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 radius-sm text-muted hover:text-app hover:bg-app/5"
          aria-label="مسح البحث"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
