import { useState, useRef, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

function isIconComponent(value: unknown): value is IconComponent {
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && value !== null && 'render' in value) return true;
  return false;
}

function pascalToKebab(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

const ICON_NAMES: string[] = (() => {
  const icons = LucideIcons as unknown as Record<string, unknown>;
  const names: string[] = [];
  for (const key of Object.keys(icons)) {
    if (key.endsWith('Icon') || key.startsWith('create') || key === 'default') continue;
    if (!isIconComponent(icons[key])) continue;
    names.push(pascalToKebab(key));
  }
  return names.sort();
})();

const ICON_MAP: Record<string, IconComponent> = (() => {
  const icons = LucideIcons as unknown as Record<string, unknown>;
  const map: Record<string, IconComponent> = {};
  for (const key of Object.keys(icons)) {
    if (key.endsWith('Icon') || key.startsWith('create') || key === 'default') continue;
    if (!isIconComponent(icons[key])) continue;
    map[pascalToKebab(key)] = icons[key] as unknown as IconComponent;
  }
  return map;
})();

const MAX_BROWSE = 240;
const MAX_FILTERED = 100;
const GRID_COLS = 6;

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IconPicker({ value, onChange, placeholder = '搜索图标...' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return ICON_NAMES.slice(0, MAX_BROWSE);
    const q = query.toLowerCase().trim();
    const startsWith: string[] = [];
    const includes: string[] = [];
    const breakAt = MAX_FILTERED;
    for (const name of ICON_NAMES) {
      if (name.startsWith(q)) {
        startsWith.push(name);
      } else if (name.includes(q)) {
        includes.push(name);
      }
      if (startsWith.length + includes.length >= breakAt) break;
    }
    return [...startsWith, ...includes].slice(0, breakAt);
  }, [query]);

  const PreviewIcon = ICON_MAP[value] ?? LucideIcons.HelpCircle;

  const handleSelect = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setIsOpen(true);
    setHighlightIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => {
          const next = i + GRID_COLS;
          return next < suggestions.length ? next : i;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => {
          const prev = i - GRID_COLS;
          return prev >= 0 ? prev : 0;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          handleSelect(suggestions[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightIndex < 0 || !isOpen) return;
    const listEl = containerRef.current?.querySelector('.icon-picker-grid');
    if (!listEl) return;
    const item = listEl.children[highlightIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => { setIsOpen(true); setHighlightIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
          />
        </div>
        {value && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] shrink-0"
            title={value}
          >
            <PreviewIcon size={18} className="text-[var(--color-text-primary)]" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-96 overflow-y-auto rounded-lg bg-[var(--color-card)] border border-[var(--color-card-border)] shadow-lg p-2">
          <div className="grid grid-cols-6 gap-1 icon-picker-grid">
            {suggestions.map((name, idx) => {
              const Icon = ICON_MAP[name] ?? LucideIcons.HelpCircle;
              const isHighlighted = idx === highlightIndex;
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                      : isHighlighted
                        ? 'bg-[var(--color-card-border)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-search-bg)]'
                  }`}
                  title={name}
                >
                  <Icon size={20} />
                  <span className="truncate w-full text-center leading-tight" style={{ fontSize: '0.6rem' }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
