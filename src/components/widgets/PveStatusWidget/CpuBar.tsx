interface CpuBarProps {
  cpu: number;
  cpuinfo?: {
    cores: number;
    cpus: number;
    model: string;
    sockets: number;
  };
}

export default function CpuBar({ cpu, cpuinfo }: CpuBarProps) {
  const percentage = Math.min(100, Math.max(0, cpu * 100));
  const cores = cpuinfo?.cores ?? (cpuinfo?.cpus ?? 0);
  const coreLabel = cores > 0 ? ` (${cores} cores)` : '';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          CPU Usage{coreLabel}
        </span>
        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
          {percentage.toFixed(1)}%
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
            backgroundColor: 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}
