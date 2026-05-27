import { Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';

export function EditModeToggle() {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);

  const handleToggle = () => {
    toggleEditMode();
    setSidebarOpen(!editMode);

    // Sync URL with edit mode so NGINX can protect /admin
    if (editMode) {
      window.history.pushState(null, '', '/');
    } else {
      window.history.pushState(null, '', '/admin');
    }
  };

  if (editMode) {
    return (
      <Button
        variant="default"
        size="sm"
        aria-label="Save and exit edit mode"
        onClick={handleToggle}
      >
        <Save className="h-4 w-4" />
        Save & Exit
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Enter edit mode"
      onClick={handleToggle}
    >
      <Pencil className="h-4 w-4" />
      Edit
    </Button>
  );
}
