import type { WidgetSettingsProps, WebPageOptions } from '@/types/widget.ts';

export default function WebPageSettings({ widgetId: _widgetId, options, onChange, onDelete: _onDelete }: WidgetSettingsProps) {
  const opts = options as unknown as WebPageOptions;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          URL
        </span>
        <input
          type="text"
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          placeholder="https://example.com"
          value={opts.url || ''}
          onChange={(e) => onChange({ ...opts, url: e.target.value })}
        />
      </label>
    </div>
  );
}
