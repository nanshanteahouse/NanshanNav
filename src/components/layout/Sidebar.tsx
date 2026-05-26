import { X } from 'lucide-react';
import { WidgetPalette } from '@/components/widgets/WidgetPalette';
import { useDashboardStore } from '@/store/index';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const editMode = useDashboardStore((s) => s.editMode);
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);

  if (!editMode || !sidebarOpen) return null;

  return (
    <aside className="w-[280px] shrink-0 h-full overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Widget Library
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
          className="h-7 w-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        <WidgetPalette />
      </div>
    </aside>
  );
}
