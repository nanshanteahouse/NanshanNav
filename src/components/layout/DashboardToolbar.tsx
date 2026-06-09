import { useState, useEffect, useRef } from 'react';
import { PanelLeft, PanelLeftClose, Palette, MoreHorizontal } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { EditModeToggle } from '@/components/common/EditModeToggle';
import { CellSizeSlider } from '@/components/common/CellSizeSlider';
import { GridLinesToggle } from '@/components/common/GridLinesToggle';
import { ExportImportButtons } from '@/components/common/ExportImportButtons';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ColorThemeEditor } from '@/components/common/ColorThemeEditor';
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
  const glassEnabled = useDashboardStore((s) => s.settings.glassEnabled);
  const glassBlur = useDashboardStore((s) => s.settings.glassBlur);
  const { t } = useTranslation();
  const [colorEditorOpen, setColorEditorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on click-outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!editMode) setMobileMenuOpen(false);
  }, [editMode]);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)]"
      style={glassEnabled ? {
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`,
        backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 70%, transparent)',
        willChange: 'backdrop-filter',
      } : undefined}
      role="toolbar"
      aria-label={t('dashboard.toolbar')}
    >
      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
        {editMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={t('toolbar.toggleWidgetPanel')}
            title={t('toolbar.toggleWidgetPanel')}
            className="shrink-0"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        )}
        {editMode ? (
          <Input
            value={dashboardTitle}
            onChange={(e) => updateSettings({ dashboardTitle: e.target.value })}
            className="min-w-0 text-xl font-semibold border-0 bg-transparent px-0 py-0 h-auto text-[var(--text-primary)] truncate"
          />
        ) : (
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight truncate">
            {dashboardTitle}
          </h1>
        )}
      </div>
      {/* Desktop buttons - hidden on small screens */}
      <div className="hidden sm:flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelect />
        <GridLinesToggle />
        <CellSizeSlider />
        {editMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setColorEditorOpen(true)}
            aria-label={t('toolbar.colorPalette')}
            title={t('toolbar.colorPalette')}
          >
            <Palette className="h-4 w-4" />
          </Button>
        )}
        <ExportImportButtons />
        <EditModeToggle />
      </div>
      {/* Mobile hamburger */}
      <div className="sm:hidden flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={t('toolbar.moreOptions')}
          title={t('toolbar.moreOptions')}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-xl p-2 space-y-1 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            <ThemeToggle showLabel />
            <LanguageSelect />
            <GridLinesToggle showLabel />
            <CellSizeSlider showLabel />
            {editMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setColorEditorOpen(true);
                  setMobileMenuOpen(false);
                }}
                aria-label={t('toolbar.colorPalette')}
                title={t('toolbar.colorPalette')}
                className="justify-start gap-2 w-full"
              >
                <Palette className="h-4 w-4" />
                <span>{t('toolbar.colorPalette')}</span>
              </Button>
            )}
            <ExportImportButtons showLabel />
            <EditModeToggle showLabel />
          </div>
        </div>
      )}
      {editMode && (
        <ColorThemeEditor open={colorEditorOpen} onClose={() => setColorEditorOpen(false)} />
      )}
    </header>
  );
}
