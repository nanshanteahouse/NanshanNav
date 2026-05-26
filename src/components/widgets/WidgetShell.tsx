import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
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
      className="flex flex-col h-full rounded-[var(--radius-default)] bg-[var(--bg-widget)] shadow-[var(--shadow-widget)] border border-[var(--border-default)] overflow-hidden"
    >
      <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-widget-hover)] cursor-grab active:cursor-grabbing select-none" role="button" aria-label={`Drag to move ${displayTitle}`} tabIndex={0}>
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {displayTitle}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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

      <div className="widget-body flex-1 overflow-hidden">{children}</div>

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
