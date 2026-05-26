import type { ChangeEvent } from 'react';

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({ value, min, max, step = 1, onChange, className }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      className={cn(
        'w-full h-2 rounded-lg appearance-none cursor-pointer',
        'bg-[var(--bg-input)]',
        className,
      )}
      style={{
        accentColor: 'var(--accent-primary)',
        background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${percentage}%, var(--bg-input) ${percentage}%, var(--bg-input) 100%)`,
      }}
    />
  );
}
