import { ThemeToggle } from '@/components/common/ThemeToggle';
import { EditModeToggle } from '@/components/common/EditModeToggle';
import { CellSizeSlider } from '@/components/common/CellSizeSlider';
import { GridLinesToggle } from '@/components/common/GridLinesToggle';
import { ExportImportButtons } from '@/components/common/ExportImportButtons';
import { Input } from '@/components/ui/input';
import { useDashboardStore } from '@/store/index';

export function DashboardToolbar() {
  const dashboardTitle = useDashboardStore((s) => s.settings.dashboardTitle);
  const editMode = useDashboardStore((s) => s.editMode);
  const updateSettings = useDashboardStore((s) => s.updateSettings);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)]"
      role="toolbar"
      aria-label="Dashboard toolbar"
    >
      <div className="flex items-center gap-3">
        {editMode ? (
          <Input
            value={dashboardTitle}
            onChange={(e) => updateSettings({ dashboardTitle: e.target.value })}
            className="min-w-0 text-xl font-semibold border-0 bg-transparent px-0 py-0 h-auto text-[var(--text-primary)]"
          />
        ) : (
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            {dashboardTitle}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        <GridLinesToggle />
        <ExportImportButtons />
        <CellSizeSlider />
        <ThemeToggle />
        <EditModeToggle />
      </div>
    </header>
  );
}
