import { PanelLeft } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';

/**
 * A narrow hover-to-expand trigger strip on the left edge of the canvas.
 * Only visible in edit mode when the sidebar is closed.
 *
 * Design intent (Plan B):
 * - Idle: 6px wide, barely visible — subtle background tint to hint "something is here"
 * - Hover: expands to 28px, shows PanelLeft icon, reveals right border for separation
 * - Click: opens the widget library sidebar
 * - VS Code-style spatial proximity: the trigger lives on the same edge as the sidebar it opens
 */
export function SidebarTrigger() {
  const editMode = useDashboardStore((s) => s.editMode);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const { t } = useTranslation();

  if (!editMode || sidebarOpen) return null;

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="group relative w-4 hover:w-7 shrink-0 cursor-pointer transition-all duration-200 flex items-center justify-center border-r border-[var(--accent-primary)]/25 hover:border-[var(--accent-primary)]/40"
      aria-label={t('sidebar.open')}
    >
      {/* always-visible strip background — must contrast with body bg-primary */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)]/85 group-hover:bg-[var(--bg-secondary)] transition-colors duration-200" />
      {/* grip indicator bar — always visible, fades on hover */}
      <div className="absolute left-1/2 top-1/3 bottom-1/3 w-0.5 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]/30 group-hover:opacity-0 transition-all duration-200" />
      {/* expand icon — fades in on hover */}
      <PanelLeft className="relative h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}
