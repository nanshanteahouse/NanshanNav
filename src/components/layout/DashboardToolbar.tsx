import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { EditModeToggle } from '@/components/common/EditModeToggle';
import { CellSizeSlider } from '@/components/common/CellSizeSlider';
import { GridLinesToggle } from '@/components/common/GridLinesToggle';
import { ExportImportButtons } from '@/components/common/ExportImportButtons';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';

export function DashboardToolbar() {
  const dashboardTitle = useDashboardStore((s) => s.settings.dashboardTitle);
  const editMode = useDashboardStore((s) => s.editMode);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const updateSettings = useDashboardStore((s) => s.updateSettings);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const { t } = useTranslation();

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)]"
      role="toolbar"
      aria-label={t('dashboard.toolbar')}
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
        {editMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={t('toolbar.toggleWidgetPanel')}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        )}
        <GridLinesToggle />
        <ExportImportButtons />
        <CellSizeSlider />
        <ThemeToggle />
        <LanguageSelect />
        <EditModeToggle />
      </div>
    </header>
  );
}
