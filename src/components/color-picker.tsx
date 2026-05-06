import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  label: string;
}

export function ColorPicker({ value, onChange, onReset, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3" ref={ref}>
      <span className="text-sm text-[var(--color-text-secondary)] w-20">{label}</span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg border border-[var(--color-card-border)] cursor-pointer"
        style={{ backgroundColor: value }}
        title={value}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 px-2 py-1 text-xs bg-[var(--color-search-bg)] border border-[var(--color-search-border)] rounded text-[var(--color-text-primary)] font-mono"
      />
      {isOpen && (
        <input
          type="color"
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(false); }}
          className="absolute opacity-0 pointer-events-none"
        />
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          title="重置"
        >
          🔄
        </button>
      )}
    </div>
  );
}
