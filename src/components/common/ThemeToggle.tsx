import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';

export function ThemeToggle() {
  const toggleDarkMode = useDashboardStore((s) => s.toggleDarkMode);
  const darkMode = useDashboardStore((s) => s.settings.darkMode);
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label={darkMode ? t('toolbar.switchToLight') : t('toolbar.switchToDark')}
      title={darkMode ? t('toolbar.switchToLight') : t('toolbar.switchToDark')}
    >
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
