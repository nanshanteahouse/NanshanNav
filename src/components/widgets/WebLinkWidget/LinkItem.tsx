import { icons, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LinkItem } from '@/types/widget.ts';
import HealthIndicator from './HealthIndicator.tsx';

interface LinkItemCardProps {
  link: LinkItem;
  reachable: boolean | null;
  onClick: () => void;
  showName?: boolean;
  showUrl?: boolean;
  showDescription?: boolean;
  compact?: boolean;
}

export default function LinkItemCard({ link, reachable, onClick, showName = true, showUrl = true, showDescription = true, compact }: LinkItemCardProps) {
  const IconComponent: LucideIcon =
    link.icon && (icons as Record<string, LucideIcon>)[link.icon]
      ? (icons as Record<string, LucideIcon>)[link.icon]
      : Globe;

  return (
    <button
      type="button"
      className={`flex w-full items-center ${compact ? 'gap-2 p-1' : 'gap-3 rounded-lg p-3'} text-left transition-colors`}
      style={{
        backgroundColor: 'transparent',
        cursor: 'pointer',
        border: 'none',
        borderRadius: compact ? undefined : undefined,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-widget-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex-shrink-0">
        <IconComponent
          className={compact ? 'h-4 w-4' : 'h-7 w-7'}
          style={{ color: 'var(--accent-primary)' }}
        />
      </div>

      <div className="min-w-0 flex-1">
        {showName && (
          <div className="flex items-center gap-2">
            <span
              className={`truncate ${compact ? 'text-xs' : 'text-sm font-semibold'}`}
              style={{ color: 'var(--text-primary)' }}
            >
              {link.name}
            </span>
            {!compact && <HealthIndicator reachable={reachable} />}
          </div>
        )}
        {!compact && showDescription && link.description && (
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {link.description}
          </p>
        )}
        {!compact && showUrl && (
          <span
            className="mt-0.5 block truncate text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {link.url}
          </span>
        )}
      </div>
    </button>
  );
}
