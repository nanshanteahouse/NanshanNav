import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { getWidgetDefinition } from '@/registry/index';
import type { WidgetConfig } from '@/types/widget';
import { Button } from '@/components/ui/button';
import WidgetSettings from '@/components/widgets/WidgetSettings';

export interface WidgetShellProps {
  widget: WidgetConfig;
  children: ReactNode;
}

export function WidgetShell({ widget, children }: WidgetShellProps) {
  const isEditMode = useDashboardStore((s) => s.editMode);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const [showSettings, setShowSettings] = useState(false);

  const definition = getWidgetDefinition(widget.type);
  const displayTitle = widget.title || definition.displayName;

  const handleOptionsChange = useCallback(
    (newOptions: Record<string, unknown>) => {
      useDashboardStore.getState().updateWidget(widget.id, {
        options: newOptions,
      });
    },
    [widget.id],
  );

  if (!isEditMode) {
    return (
      <div
        data-widget-type={widget.type}
        data-widget-id={widget.id}
        className="widget-body h-full"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-widget-type={widget.type}
      data-widget-id={widget.id}
      className="group relative flex flex-col h-full rounded-[var(--radius-default)] bg-[var(--bg-widget)] shadow-[var(--shadow-widget)] border border-[var(--border-default)] overflow-hidden"
    >
      <div
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        aria-label={`Edit controls for ${displayTitle}`}
      >
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-widget-hover)]/90 backdrop-blur-sm border border-[var(--border-default)] shadow-md pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            aria-label="Widget settings"
            className="h-7 w-7"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeWidget(widget.id)}
            aria-label="Delete widget"
            className="h-7 w-7 text-[var(--status-offline)] hover:text-[var(--status-offline)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="widget-body h-full overflow-hidden">{children}</div>

      <WidgetSettings
        widgetId={widget.id}
        options={widget.options}
        onChange={handleOptionsChange}
        onClose={() => setShowSettings(false)}
        open={showSettings}
      />
    </div>
  );
}
