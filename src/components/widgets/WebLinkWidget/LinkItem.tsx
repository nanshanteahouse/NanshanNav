import { Globe } from 'lucide-react';
import type { LinkItem } from '@/types/widget.ts';
import HealthIndicator from './HealthIndicator.tsx';

interface LinkItemCardProps {
  link: LinkItem;
  reachable: boolean | null;
  onClick: () => void;
}

export default function LinkItemCard({ link, reachable, onClick }: LinkItemCardProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg p-4 text-left transition-colors"
      style={{
        backgroundColor: 'transparent',
        cursor: 'pointer',
        border: 'none',
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
        <Globe
          className="h-7 w-7"
          style={{ color: 'var(--accent-primary)' }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {link.name}
          </span>
          <HealthIndicator reachable={reachable} />
        </div>
        {link.description && (
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {link.description}
          </p>
        )}
        <span
          className="mt-0.5 block truncate text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {link.url}
        </span>
      </div>
    </button>
  );
}
