import { DashboardToolbar } from '@/components/layout/DashboardToolbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardCanvas } from '@/components/layout/DashboardCanvas';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export function AppLayout() {
  useKeyboardShortcut();

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <DashboardCanvas />
      </div>
    </div>
  );
}
