import { useEffect, useRef, useState } from 'react';
import { suggestLocations } from '../../services/items/itemService';

interface LocationInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export function LocationInput({
  value,
  onChange,
  placeholder = 'أين وضعته؟',
  id,
  required,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      const list = await suggestLocations(value);
      if (!active) return;
      setSuggestions(list);
      setShowSuggest(list.length > 0 && value.trim().length > 0);
      setActiveIdx(-1);
    }, 120);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function pick(s: string) {
    onChange(s);
    setShowSuggest(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.trim() && suggestions.length > 0 && setShowSuggest(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full bg-surface text-app border border-app radius-md px-4 py-3 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
      />
      {showSuggest && suggestions.length > 0 && (
        <ul
          className="absolute z-30 mt-1 w-full bg-surface border border-app radius-md elev-sm max-h-56 overflow-auto no-scrollbar"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => pick(s)}
                className={`w-full text-right px-4 py-2.5 text-sm hover:bg-surface-muted ${
                  i === activeIdx ? 'bg-surface-muted text-brand-600 dark:text-brand-400' : 'text-app'
                }`}
                role="option"
                aria-selected={i === activeIdx}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
