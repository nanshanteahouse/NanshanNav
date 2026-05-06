import type { ServiceStatus } from '../types';

interface StatusIndicatorProps {
  status: ServiceStatus | undefined;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (!status || status === 'unknown') return null;

  const colorMap: Record<string, string> = {
    online: 'bg-[var(--color-status-online)]',
    offline: 'bg-[var(--color-status-offline)]',
    checking: 'bg-gray-400 animate-pulse',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorMap[status] ?? ''}`}
      title={status === 'online' ? '在线' : status === 'offline' ? '离线' : '检测中'}
    />
  );
}
