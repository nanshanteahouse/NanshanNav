import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { icons, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ALL_ICONS: { name: string; Icon: LucideIcon }[] = Object.entries(icons)
  .map(([name, Icon]) => ({ name, Icon }))
  .sort((a, b) => a.name.localeCompare(b.name));

const PAGE_SIZE = 48;

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  variant?: 'inline' | 'popover';
}

export function IconPicker({ value, onChange, variant = 'inline' }: IconPickerProps) {
  if (variant === 'popover') {
    return <PopoverIconPicker value={value} onChange={onChange} />;
  }
  return <InlineIconPicker value={value} onChange={onChange} />;
}

function InlineIconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_ICONS;
    const lower = search.toLowerCase();
    return ALL_ICONS.filter(({ name }) => name.toLowerCase().includes(lower));
  }, [search]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name === value ? '' : name);
    },
    [value, onChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setVisibleCount(PAGE_SIZE);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="Search icons..."
        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-primary)',
        }}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="self-start text-xs rounded px-2 py-1 transition-colors"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-muted)',
          }}
        >
          Clear selection
        </button>
      )}

      <div
        className="grid gap-1 overflow-y-auto rounded-md border p-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
          maxHeight: '240px',
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--bg-input)',
        }}
      >
        {displayed.map(({ name, Icon }) => {
          const isSelected = name === value;
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => handleSelect(name)}
              className="flex items-center justify-center rounded-md p-1 transition-colors"
              style={{
                backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                width: '36px',
                height: '36px',
              }}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="text-xs text-center py-1.5 rounded-md transition-colors"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-input)',
          }}
        >
          Show more ({filtered.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

function PopoverIconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_ICONS;
    const lower = search.toLowerCase();
    return ALL_ICONS.filter(({ name }) => name.toLowerCase().includes(lower));
  }, [search]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const SelectedIcon = value ? (icons as Record<string, LucideIcon>)[value] : null;

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setVisibleCount(PAGE_SIZE);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name === value ? '' : name);
      setOpen(false);
      setSearch('');
      setVisibleCount(PAGE_SIZE);
    },
    [value, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
        style={{
          borderColor: open ? 'var(--accent-primary)' : 'var(--border-default)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-primary)',
        }}
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <span className="flex-1 text-left">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
            Choose icon...
          </span>
        )}
        {value && (
          <X
            className="h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
            style={{ color: 'var(--text-muted)' }}
            onClick={handleClear}
          />
        )}
      </button>

      {open && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border p-3 shadow-lg"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-widget)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative mb-2">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={search}
              autoFocus
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search..."
              className="w-full rounded-md border py-1.5 pl-8 pr-3 text-sm focus:outline-none"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div
            className="grid grid-cols-7 gap-0.5 overflow-y-auto p-1"
            style={{ maxHeight: '200px' }}
          >
            {displayed.map(({ name, Icon }) => {
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => handleSelect(name)}
                  className="flex items-center justify-center rounded-md p-1 transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    width: '32px',
                    height: '32px',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="mt-1 w-full text-xs py-1 rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Show more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
