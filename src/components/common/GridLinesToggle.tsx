import { Grid3x3 } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export function GridLinesToggle({ showLabel = false }: { showLabel?: boolean }) {
  const editMode = useDashboardStore((s) => s.editMode);
  const showGridLines = useDashboardStore((s) => s.settings.showGridLines);
  const updateSettings = useDashboardStore((s) => s.updateSettings);
  const { t } = useTranslation();

  if (!editMode) return null;

  const label = showGridLines ? t('toolbar.hideGrid') : t('toolbar.showGrid');

  return (
    <Button
      variant={showGridLines ? 'default' : 'ghost'}
      size={showLabel ? 'sm' : 'icon'}
      aria-label={label}
      title={label}
      onClick={() => updateSettings({ showGridLines: !showGridLines })}
      className={showLabel ? 'justify-start gap-2' : ''}
    >
      <Grid3x3 className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
