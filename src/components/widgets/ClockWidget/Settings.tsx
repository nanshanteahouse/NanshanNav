import type { WidgetSettingsProps, ClockOptions } from '@/types/widget.ts';
import { Trash2 } from 'lucide-react';

export default function ClockSettings({ widgetId: _widgetId, options, onChange, onDelete }: WidgetSettingsProps) {
  const opts = options as unknown as ClockOptions;

  const update = (patch: Partial<ClockOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Display Mode
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.displayMode}
          onChange={(e) => update({ displayMode: e.target.value as 'analog' | 'digital' })}
        >
          <option value="digital">Digital</option>
          <option value="analog">Analog</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Timezone
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.timezone}
          onChange={(e) => update({ timezone: e.target.value })}
          placeholder="Asia/Shanghai"
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.showSeconds}
          onChange={(e) => update({ showSeconds: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Show Seconds
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.showDate}
          onChange={(e) => update({ showDate: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Show Date
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.is24Hour}
          onChange={(e) => update({ is24Hour: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          24-Hour Format
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Date Format
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.dateFormat}
          onChange={(e) => update({ dateFormat: e.target.value })}
          placeholder="YYYY-MM-DD dddd"
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
