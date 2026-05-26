import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/index';

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface WidgetErrorProps {
  widgetId: string;
}

export function WidgetError({ widgetId }: WidgetErrorProps) {
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const widget = useDashboardStore((s) => s.widgets.find((w) => w.id === widgetId));

  const handleRetry = () => {
    window.location.reload();
  };

  const handleRemove = () => {
    removeWidget(widgetId);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6 rounded-[var(--radius-default)]',
        'border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5',
      )}
    >
      <AlertTriangle className="h-8 w-8 text-[var(--status-warning)]" />
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">Widget Error</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {widget?.title ?? widgetId}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
