import { useState, useMemo, useCallback } from 'react';
import { icons, type LucideIcon } from 'lucide-react';

const ALL_ICONS: { name: string; Icon: LucideIcon }[] = Object.entries(icons)
  .map(([name, Icon]) => ({ name, Icon }))
  .sort((a, b) => a.name.localeCompare(b.name));

const PAGE_SIZE = 48;

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
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
