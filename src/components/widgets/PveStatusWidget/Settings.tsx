import type { WidgetSettingsProps, PveStatusOptions } from '@/types/widget.ts';
import { Trash2 } from 'lucide-react';

export default function PveStatusSettings({ widgetId: _widgetId, options, onChange, onDelete }: WidgetSettingsProps) {
  const opts = options as unknown as PveStatusOptions;

  const update = (patch: Partial<PveStatusOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Proxmox Host
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.proxmoxHost}
          onChange={(e) => update({ proxmoxHost: e.target.value })}
          placeholder="e.g., pve.lan:8006"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Node Name
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.nodeName}
          onChange={(e) => update({ nodeName: e.target.value })}
          placeholder="e.g., pve"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          API Token
        </span>
        <input
          type="password"
          className="rounded-md border px-4 py-2.5 text-sm font-mono"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.apiToken}
          onChange={(e) => update({ apiToken: e.target.value })}
          placeholder="monitor@pve!dashboard=YOUR_SECRET"
        />
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Format: user@realm!tokenid=secret
        </p>
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showCpu}
            onChange={(e) => update({ showCpu: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Show CPU
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showMemory}
            onChange={(e) => update({ showMemory: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Show Memory
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showUptime}
            onChange={(e) => update({ showUptime: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Show Uptime
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showStorage}
            onChange={(e) => update({ showStorage: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Show Storage
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={opts.showVmCounts}
            onChange={(e) => update({ showVmCounts: e.target.checked })}
          />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Show VM Counts
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Refresh Interval (seconds)
        </span>
        <input
          type="number"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          min={5}
          max={3600}
          value={opts.refreshInterval}
          onChange={(e) => update({ refreshInterval: Number(e.target.value) || 15 })}
        />
      </label>

      <div className="mt-2 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--status-offline)',
            color: '#fff',
          }}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete Widget
        </button>
      </div>
    </div>
  );
}
