import type { WidgetComponentProps, PveStatusOptions } from '@/types/widget.ts';
import { usePveStatus } from './usePveStatus.ts';
import CpuBar from './CpuBar.tsx';
import MemoryBar from './MemoryBar.tsx';
import UptimeDisplay from './UptimeDisplay.tsx';
import StorageBar from './StorageBar.tsx';

export default function PveStatusWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as PveStatusOptions;
  const { nodeStatusQuery, resourcesQuery } = usePveStatus(opts);

  const isLoading = nodeStatusQuery.isLoading;
  const isError = nodeStatusQuery.isError || resourcesQuery.isError;
  const errorMsg =
    (nodeStatusQuery.error instanceof Error ? nodeStatusQuery.error.message : undefined) ??
    (resourcesQuery.error instanceof Error ? resourcesQuery.error.message : undefined);

  const data = nodeStatusQuery.data;
  const resources = resourcesQuery.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4" data-widget-type="pve-status">
        <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <div
            className="h-6 w-6 animate-spin rounded-full border-2"
            style={{
              borderColor: 'var(--border-default)',
              borderTopColor: 'var(--accent-primary)',
            }}
          />
          <span className="text-xs">Loading PVE data...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center" data-widget-type="pve-status">
        <span className="text-sm" style={{ color: 'var(--status-offline)' }}>
          Connection Error
        </span>
        {errorMsg && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {errorMsg}
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last update: {nodeStatusQuery.dataUpdatedAt ? new Date(nodeStatusQuery.dataUpdatedAt).toLocaleTimeString() : 'never'}
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4" data-widget-type="pve-status">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No data available
        </span>
      </div>
    );
  }

  const vmResources = resources.filter((r) => r.type === 'qemu');
  const lxcResources = resources.filter((r) => r.type === 'lxc');
  const vmsRunning = vmResources.filter((r) => r.status === 'running').length;
  const vmsStopped = vmResources.length - vmsRunning;
  const lxcsRunning = lxcResources.filter((r) => r.status === 'running').length;
  const lxcsStopped = lxcResources.length - lxcsRunning;

  return (
    <div
      className="flex h-full w-full flex-col gap-2 overflow-auto p-4"
      data-widget-type="pve-status"
    >
      <div className="text-center">
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {opts.nodeName || opts.proxmoxHost || 'Proxmox VE'}
        </span>
      </div>

      {opts.showCpu && (
        <CpuBar cpu={data.cpu} cpuinfo={data.cpuinfo} />
      )}

      {opts.showMemory && (
        <MemoryBar memory={data.memory} />
      )}

      {opts.showUptime && (
        <UptimeDisplay uptime={data.uptime} />
      )}

      {opts.showStorage && data.rootfs && (
        <StorageBar used={data.rootfs.used} total={data.rootfs.total} />
      )}

      {opts.showVmCounts && (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>VMs</span>
            <span style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--status-online)' }}>{vmsRunning} running</span>
              {vmsStopped > 0 && (
                <span style={{ color: 'var(--text-muted)' }}> / {vmsStopped} stopped</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>LXCs</span>
            <span style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--status-online)' }}>{lxcsRunning} running</span>
              {lxcsStopped > 0 && (
                <span style={{ color: 'var(--text-muted)' }}> / {lxcsStopped} stopped</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
