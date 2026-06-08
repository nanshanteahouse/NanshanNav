import { Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';
import { useServerSync } from '@/hooks/useServerSync';

export function EditModeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const { t } = useTranslation();
  const { saveToServer } = useServerSync();

  const handleToggle = () => {
    if (editMode) {
      // Exiting edit mode: persist config to server, then back to homepage
      saveToServer();
      toggleEditMode();
      setSidebarOpen(false);
      window.history.pushState(null, '', '/');
      return;
    }

    // Entering edit mode: trigger Authelia auth via full page navigation
    sessionStorage.setItem('nanshan_edit_mode', '1');
    window.location.assign('/admin');
  };

  if (editMode) {
    return (
      <Button
        variant="default"
        size={showLabel ? 'sm' : 'icon'}
        aria-label={t('toolbar.exitEditMode')}
        title={t('toolbar.exitEditMode')}
        onClick={handleToggle}
      >
        <Save className="h-4 w-4" />
        {showLabel && t('toolbar.saveExit')}
      </Button>
    );
  }

  return (
    <Button
      variant={showLabel ? 'outline' : 'ghost'}
      size={showLabel ? 'sm' : 'icon'}
      aria-label={t('toolbar.enterEditMode')}
      title={t('toolbar.enterEditMode')}
      onClick={handleToggle}
    >
      <Pencil className="h-4 w-4" />
      {showLabel && t('toolbar.editBtn')}
    </Button>
  );
}
