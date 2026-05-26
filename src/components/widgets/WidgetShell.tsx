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
      <div
        className="group drag-handle flex items-center justify-between px-2 py-1 group-hover:py-2 border-b border-[var(--border-default)] bg-[var(--bg-widget-hover)] cursor-grab active:cursor-grabbing select-none transition-all duration-200"
        role="button"
        aria-label={`Drag to move ${displayTitle}`}
        tabIndex={0}
      >
        <div className="flex items-center gap-1 group-hover:gap-2 min-w-0 transition-all duration-200">
          <GripVertical className="h-3 w-3 group-hover:h-3.5 group-hover:w-3.5 text-[var(--text-muted)] shrink-0 transition-all duration-200" />
          <span className="text-xs font-medium text-[var(--text-primary)] truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {displayTitle}
          </span>
        </div>
        <div className="flex items-center gap-0.5 group-hover:gap-1 shrink-0 transition-all duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            aria-label="Widget settings"
            className="h-6 w-6 group-hover:h-7 group-hover:w-7 transition-all duration-200"
          >
            <Settings className="h-3 w-3 group-hover:h-3.5 group-hover:w-3.5 transition-all duration-200" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeWidget(widget.id)}
            aria-label="Delete widget"
            className="h-6 w-6 group-hover:h-7 group-hover:w-7 text-[var(--status-offline)] hover:text-[var(--status-offline)] transition-all duration-200"
          >
            <Trash2 className="h-3 w-3 group-hover:h-3.5 group-hover:w-3.5 transition-all duration-200" />
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
