import type { WidgetSettingsProps, SearchBoxOptions } from '@/types/widget.ts';
import { Trash2 } from 'lucide-react';

export default function SearchBoxSettings({ widgetId: _widgetId, options, onChange, onDelete }: WidgetSettingsProps) {
  const opts = options as unknown as SearchBoxOptions;

  const update = (patch: Partial<SearchBoxOptions>) => {
    onChange({ ...opts, ...patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Default Engine
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.defaultEngine}
          onChange={(e) => update({ defaultEngine: e.target.value as SearchBoxOptions['defaultEngine'] })}
        >
          <option value="google">Google</option>
          <option value="baidu">Baidu</option>
          <option value="bing">Bing</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      {opts.defaultEngine === 'custom' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Custom Engine URL
          </span>
          <input
            type="text"
            className="rounded-md border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            value={opts.customEngineUrl || ''}
            onChange={(e) => update({ customEngineUrl: e.target.value })}
            placeholder="https://search.example.com?q={query}"
          />
        </label>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.enableLocalSearch}
          onChange={(e) => update({ enableLocalSearch: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Enable Local Search
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Placeholder
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.placeholder}
          onChange={(e) => update({ placeholder: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.ctrlKEnabled}
          onChange={(e) => update({ ctrlKEnabled: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Enable Ctrl+K Hotkey
        </span>
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
