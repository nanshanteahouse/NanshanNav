import type { WidgetSettingsProps, WebPageOptions, WebPageDisplayMode } from '@/types/widget.ts';

const DISPLAY_MODE_OPTIONS: { value: WebPageDisplayMode; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Detect by URL (.svg/.png → image, others → iframe)' },
  { value: 'iframe', label: 'Iframe', description: 'Embed as webpage (many sites block this)' },
  { value: 'image', label: 'Image', description: 'Load as image (SVG, PNG, JPG, etc.)' },
];

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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Display Mode
        </span>
        <div className="flex flex-col gap-1.5">
          {DISPLAY_MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors"
              style={{
                borderColor: opts.displayMode === opt.value ? 'var(--accent-primary)' : 'var(--border-default)',
                backgroundColor: opts.displayMode === opt.value ? 'var(--bg-widget-hover)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="displayMode"
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: 'var(--accent-primary)' }}
                checked={opts.displayMode === opt.value}
                onChange={() => onChange({ ...opts, displayMode: opt.value })}
              />
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {opt.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
