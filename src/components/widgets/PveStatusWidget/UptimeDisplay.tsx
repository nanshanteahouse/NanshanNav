import { formatUptime } from '@/lib/utils/format-uptime.ts';

interface UptimeDisplayProps {
  uptime: number;
}

export default function UptimeDisplay({ uptime }: UptimeDisplayProps) {
  const formatted = formatUptime(uptime);

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
        Uptime
      </span>
      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
        {formatted}
      </span>
    </div>
  );
}
