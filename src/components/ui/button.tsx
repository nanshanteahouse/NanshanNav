import type { ButtonHTMLAttributes, ReactNode } from 'react';

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'icon';
  children: ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] shadow-[var(--shadow-sm)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-widget-hover)] hover:text-[var(--text-primary)]',
  outline:
    'border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-widget-hover)]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  default: 'px-4 py-2 text-sm rounded-lg',
  icon: 'p-2 rounded-lg',
};

export function Button({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-[var(--transition-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
