import { Grid3x3 } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { Button } from '@/components/ui/button';

export function GridLinesToggle() {
  const editMode = useDashboardStore((s) => s.editMode);
  const showGridLines = useDashboardStore((s) => s.settings.showGridLines);
  const updateSettings = useDashboardStore((s) => s.updateSettings);

  if (!editMode) return null;

  return (
    <Button
      variant={showGridLines ? 'default' : 'ghost'}
      size="icon"
      aria-label={showGridLines ? 'Hide grid lines' : 'Show grid lines'}
      title={showGridLines ? 'Hide grid lines' : 'Show grid lines'}
      onClick={() => updateSettings({ showGridLines: !showGridLines })}
    >
      <Grid3x3 className="h-4 w-4" />
    </Button>
  );
}
