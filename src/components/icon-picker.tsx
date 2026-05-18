import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

const ALL_ICONS = (() => {
  const icons = LucideIcons as unknown as Record<string, unknown>;
  const list: string[] = [];
  const map: Record<string, IconComponent> = {};
  for (const key of Object.keys(icons)) {
    if (key.endsWith('Icon') || key.startsWith('create') || key === 'default') continue;
    if (!isIconComponent(icons[key])) continue;
    const kebab = pascalToKebab(key);
    list.push(kebab);
    map[kebab] = icons[key] as unknown as IconComponent;
  }
  list.sort();
  return { list, map };
})();

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IconPicker({ value, onChange, placeholder = '如: hard-drive' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const PreviewIcon = ALL_ICONS.map[value] ?? LucideIcons.HelpCircle;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_ICONS.list;
    return ALL_ICONS.list.filter((name) => name.includes(q));
  }, [search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = useCallback((name: string) => {
    onChange(name);
    setOpen(false);
  }, [onChange]);

  return (
    <>
      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
        />
        {value && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] shrink-0" title={value}>
            <PreviewIcon size={18} className="text-[var(--color-text-primary)]" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shrink-0"
        >
          <LucideIcons.Grid3X3 size={14} />
          浏览
        </button>
      </div>

      {/* Portal: Icon Browser */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-[680px] max-w-[90vw] max-h-[80vh] bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-card-border)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">选择 Lucide 图标</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-border)] transition-colors"
              >
                <LucideIcons.X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <LucideIcons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索图标..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  没有匹配的图标
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-8 gap-1.5">
                    {filtered.map((name) => {
                      const Icon = ALL_ICONS.map[name] ?? LucideIcons.HelpCircle;
                      const isSelected = name === value;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleSelect(name)}
                          title={name}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-search-bg)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          <Icon size={22} />
                          <span className="truncate w-full text-center leading-tight" style={{ fontSize: '0.6rem' }}>
                            {name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
                    共 {ALL_ICONS.list.length} 个图标，匹配 {filtered.length} 个
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
