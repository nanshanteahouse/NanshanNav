import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { ClipboardPaste, Copy, CopyPlus, Settings, Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { getWidgetDefinition } from '@/registry/index';
import { BREAKPOINTS } from '@/lib/constants';
import type { Breakpoint } from '@/lib/constants';
import type { WidgetConfig } from '@/types/widget';
import { Button } from '@/components/ui/button';
import WidgetSettings from '@/components/widgets/WidgetSettings';
import { useTranslation } from '@/i18n';

function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth;
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  if (width >= BREAKPOINTS.xs) return 'xs';
  return 'xxs';
}

export interface WidgetShellProps {
  widget: WidgetConfig;
  children: ReactNode;
}

export function WidgetShell({ widget, children }: WidgetShellProps) {
  const isEditMode = useDashboardStore((s) => s.editMode);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const clipboard = useDashboardStore((s) => s.clipboard);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

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
        className="widget-body h-full overflow-hidden scrollbar-thin border border-transparent"
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
      <style>{`
  @media (hover: hover) {
    :where(.edit-controls) {
      opacity: 0;
    }
    :where(.group):hover .edit-controls {
      opacity: 1;
    }
  }
  @media (hover: none) {
    :where(.edit-controls) {
      opacity: 0.7;
    }
  }
`}</style>
      <div
        className="edit-controls absolute top-2 right-2 z-10 transition-opacity duration-200 pointer-events-none"
        aria-label={t('widgetShell.editControls', { title: displayTitle })}
      >
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[var(--bg-widget-hover)]/90 backdrop-blur-sm border border-[var(--border-default)] shadow-md pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useDashboardStore.getState().copyWidget(widget)}
            aria-label={t('widgetShell.copy')}
            className="h-7 w-7"
            style={{ minHeight: 0, minWidth: 0, padding: 0 }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            aria-label={t('widgetShell.settings')}
            className="h-7 w-7"
            style={{ minHeight: 0, minWidth: 0, padding: 0 }}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useDashboardStore.getState().pasteWidget(getCurrentBreakpoint())}
            aria-label={t('widgetShell.paste')}
            className={`h-7 w-7 ${!clipboard ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ minHeight: 0, minWidth: 0, padding: 0 }}
            disabled={!clipboard}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useDashboardStore.getState().duplicateWidget(widget.id, getCurrentBreakpoint())}
            aria-label={t('widgetShell.duplicate')}
            className="h-7 w-7"
            style={{ minHeight: 0, minWidth: 0, padding: 0 }}
          >
            <CopyPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeWidget(widget.id)}
            aria-label={t('widgetShell.delete')}
            className="h-7 w-7 text-[var(--status-offline)] hover:text-[var(--status-offline)]"
            style={{ minHeight: 0, minWidth: 0, padding: 0 }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="widget-body h-full overflow-hidden scrollbar-thin">{children}</div>

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
