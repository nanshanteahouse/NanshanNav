interface HealthIndicatorProps {
  reachable: boolean | null;
}

export default function HealthIndicator({ reachable }: HealthIndicatorProps) {
  const baseClasses = 'inline-block h-2.5 w-2.5 rounded-full flex-shrink-0';

  if (reachable === null) {
    return (
      <span
        className={`${baseClasses} animate-pulse`}
        style={{ backgroundColor: 'var(--text-muted)' }}
        title="Checking..."
      />
    );
  }

  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: reachable ? 'var(--status-online)' : 'var(--status-offline)',
      }}
      title={reachable ? 'Online' : 'Offline'}
    />
  );
}
