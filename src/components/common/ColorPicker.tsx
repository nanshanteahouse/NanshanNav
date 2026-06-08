import { useRef } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-start max-sm:gap-1">
      {label && (
        <span className="text-sm min-w-[90px] max-sm:min-w-0" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      <button
        type="button"
        className="h-7 w-7 rounded-md border cursor-pointer flex-shrink-0"
        style={{
          backgroundColor: value,
          borderColor: 'var(--border-default)',
        }}
        onClick={() => inputRef.current?.click()}
        aria-label={label ? `Pick color for ${label}` : 'Pick color'}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          // Allow intermediate values during typing (e.g. '#f' or '#ff0')
          if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              onChange(v);
            }
          }
        }}
        onBlur={(e) => {
          // On blur, if the value isn't a full hex, restore to original
          const v = e.target.value;
          if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
            // Reset to current prop value
            e.target.value = value;
          }
        }}
        className="w-24 max-sm:w-full rounded-md border px-2 py-1 text-sm font-mono"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
        }}
        maxLength={7}
        placeholder="#RRGGBB"
      />
    </div>
  );
}
