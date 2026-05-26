import { ThemeToggle } from '@/components/common/ThemeToggle';
import { EditModeToggle } from '@/components/common/EditModeToggle';
import { CellSizeSlider } from '@/components/common/CellSizeSlider';
import { GridLinesToggle } from '@/components/common/GridLinesToggle';
import { ExportImportButtons } from '@/components/common/ExportImportButtons';
import { useDashboardStore } from '@/store/index';

export function DashboardToolbar() {
  const dashboardTitle = useDashboardStore((s) => s.settings.dashboardTitle);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)]"
      role="toolbar"
      aria-label="Dashboard toolbar"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
          {dashboardTitle}
        </h1>
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
