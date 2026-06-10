import { DashboardToolbar } from '@/components/layout/DashboardToolbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardCanvas } from '@/components/layout/DashboardCanvas';
import { useDashboardStore } from '@/store/index';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function AppLayout() {
  const editMode = useDashboardStore((s) => s.editMode);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar />
      {editMode && sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false); }}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <DashboardCanvas />
      </div>
    </div>
  );
}
