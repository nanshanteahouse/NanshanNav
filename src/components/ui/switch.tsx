function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({ checked, onCheckedChange, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-8 w-14 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-[var(--transition-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]',
        checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-input)]',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-[var(--shadow-sm)] ring-0 transition-transform duration-[var(--transition-fast)]',
          checked ? 'translate-x-6' : 'translate-x-0',
        )}
      />
    </button>
  );
}
