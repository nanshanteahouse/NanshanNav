import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';
import { useTranslation } from '@/i18n';
import type { ThemeMode } from '@/types/dashboard';

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const setThemeMode = useDashboardStore((s) => s.setThemeMode);
  const themeMode = useDashboardStore((s) => s.settings.themeMode);
  const { t } = useTranslation();

  const nextMode: Record<ThemeMode, ThemeMode> = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  };

  const icon = themeMode === 'dark' ? <Sun className="h-4 w-4" /> :
    themeMode === 'system' ? <Monitor className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

  const label = themeMode === 'light' ? t('toolbar.switchToDark') :
    themeMode === 'dark' ? t('toolbar.switchToLight') :
    t('toolbar.themeSystem');

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      onClick={() => setThemeMode(nextMode[themeMode])}
      aria-label={label}
      title={label}
      className={showLabel ? 'justify-start gap-2' : ''}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
