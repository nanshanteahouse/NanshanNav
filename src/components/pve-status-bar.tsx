import { useStore } from '../store';
import { fetchPveStatus } from '../api';
import { useEffect, useCallback, useRef } from 'react';
import type { PveStatus } from '../types';
import { Cpu, MemoryStick, Clock, AlertTriangle } from 'lucide-react';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-24 h-2 bg-[var(--color-card-border)] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function PveStatusBar() {
  const settings = useStore((s) => s.settings);
  const setPveStatus = useStore((s) => s.setPveStatus);
  const pveStatus = useStore((s) => s.pveStatus);
  const failCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await fetchPveStatus() as PveStatus;
      setPveStatus(data);
      if (data.status === 'online') {
        failCountRef.current = 0;
      } else {
        failCountRef.current += 1;
      }
    } catch {
      setPveStatus({ status: 'offline', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null });
      failCountRef.current += 1;
    }

    if (intervalRef.current) {
      const targetMs = failCountRef.current >= 3 ? 300000 : settings.statusCheckInterval * 1000;
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(poll, targetMs);
    }
  }, [setPveStatus, settings.statusCheckInterval]);

  useEffect(() => {
    if (!settings.enablePveOverview) return;

    failCountRef.current = 0;
    poll();

    const ms = settings.statusCheckInterval * 1000;
    intervalRef.current = setInterval(poll, ms);

    const handleVisibility = () => {
      if (!document.hidden) {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [settings.enablePveOverview, settings.statusCheckInterval, poll]);

  if (!settings.enablePveOverview) return null;

  if (pveStatus.status === 'offline') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-status-offline)]/30 text-sm text-[var(--color-status-offline)]">
        <AlertTriangle size={16} />
        ⚠ PVE 离线
      </div>
    );
  }

  if (pveStatus.status === 'unauthorized') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-yellow-500/30 text-sm text-yellow-500">
        <AlertTriangle size={16} />
        ⚠ PVE 未授权，请检查 Token
      </div>
    );
  }

  const cpuPct = pveStatus.cpu !== null ? Math.round(pveStatus.cpu * 100) : 0;
  const memUsed = pveStatus.memoryUsed !== null ? pveStatus.memoryUsed / (1024 * 1024 * 1024) : 0;
  const memTotal = pveStatus.memoryTotal !== null ? pveStatus.memoryTotal / (1024 * 1024 * 1024) : 0;
  const memPct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;

  const cpuColor = cpuPct > 80 ? 'var(--color-status-offline)' : cpuPct > 50 ? '#F59E0B' : 'var(--color-status-online)';
  const memColor = memPct > 80 ? 'var(--color-status-offline)' : memPct > 50 ? '#F59E0B' : 'var(--color-status-online)';

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] text-xs text-[var(--color-text-secondary)] flex-wrap">
      <span className="font-medium text-[var(--color-text-primary)]">🖥 PVE</span>
      <div className="flex items-center gap-1.5">
        <Cpu size={14} />
        <span>CPU</span>
        <ProgressBar value={cpuPct} max={100} color={cpuColor} />
        <span className="text-[var(--color-text-primary)] font-mono">{cpuPct}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <MemoryStick size={14} />
        <span>内存</span>
        <ProgressBar value={memPct} max={100} color={memColor} />
        <span className="text-[var(--color-text-primary)] font-mono">{memUsed.toFixed(1)}/{memTotal.toFixed(0)} GB</span>
      </div>
      {pveStatus.uptime !== null && (
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>↑ {formatUptime(pveStatus.uptime)}</span>
        </div>
      )}
    </div>
  );
}
