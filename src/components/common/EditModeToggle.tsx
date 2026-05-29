import { Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';

export function EditModeToggle() {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const { t } = useTranslation();

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
        aria-label={t('toolbar.exitEditMode')}
        onClick={handleToggle}
      >
        <Save className="h-4 w-4" />
        {t('toolbar.saveExit')}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={t('toolbar.enterEditMode')}
      onClick={handleToggle}
    >
      <Pencil className="h-4 w-4" />
      {t('toolbar.editBtn')}
    </Button>
  );
}
