import { useDashboardStore } from '@/store/index';
import { CELL_SIZE_MIN, CELL_SIZE_MAX } from '@/lib/constants';

export function CellSizeSlider() {
  const editMode = useDashboardStore((s) => s.editMode);
  const rowHeight = useDashboardStore((s) => s.settings.cellSize);
  const updateSettings = useDashboardStore((s) => s.updateSettings);

  if (!editMode) return null;

  const pct = ((rowHeight - CELL_SIZE_MIN) / (CELL_SIZE_MAX - CELL_SIZE_MIN)) * 100;

  return (
    <div className="flex items-center gap-2" title="Row height (column width is auto-calculated from container width)">
      <label className="text-xs text-[var(--text-muted)] whitespace-nowrap">
        Row: {rowHeight}px
      </label>
      <input
        type="range"
        min={CELL_SIZE_MIN}
        max={CELL_SIZE_MAX}
        value={rowHeight}
        aria-label="Row height in pixels"
        onChange={(e) => updateSettings({ cellSize: Number(e.target.value) })}
        className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: 'var(--accent-primary)',
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--bg-input) ${pct}%)`,
        }}
      />
    </div>
  );
}
