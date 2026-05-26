import { formatBytes } from '@/lib/utils/format-bytes.ts';

interface MemoryBarProps {
  memory: {
    used: number;
    total: number;
    free?: number;
  };
}

export default function MemoryBar({ memory }: MemoryBarProps) {
  const ratio = memory.total > 0 ? Math.min(1, memory.used / memory.total) : 0;
  const percentage = ratio * 100;
  const usedStr = formatBytes(memory.used);
  const totalStr = formatBytes(memory.total);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          Memory
        </span>
        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
          {usedStr} / {totalStr}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--border-default)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage > 80 ? 'var(--status-warning)' : 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}
