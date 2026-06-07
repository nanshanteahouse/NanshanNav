import type { WidgetSettingsProps, TitleHeaderOptions } from '@/types/widget.ts';
import { IconPicker } from '@/components/ui/icon-picker';

export default function TitleHeaderSettings({ widgetId: _widgetId, options, onChange }: WidgetSettingsProps) {
  const opts = options as unknown as TitleHeaderOptions;

  const update = (patch: Partial<TitleHeaderOptions>) => {
    onChange({ ...opts, ...patch });
  };

  const headingLabels: Record<TitleHeaderOptions['headingLevel'], string> = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Icon
        </span>
        <IconPicker
          value={opts.iconName}
          onChange={(iconName) => update({ iconName })}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Heading Level
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.headingLevel}
          onChange={(e) => update({ headingLevel: e.target.value as TitleHeaderOptions['headingLevel'] })}
        >
          {(['h1', 'h2', 'h3', 'h4'] as const).map((level) => (
            <option key={level} value={level}>
              {headingLabels[level]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Text Alignment
        </span>
        <select
          className="rounded-md border px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={opts.textAlign}
          onChange={(e) => update({ textAlign: e.target.value as TitleHeaderOptions['textAlign'] })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.showDivider}
          onChange={(e) => update({ showDivider: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Show Divider
        </span>
      </label>
    </div>
  );
}
