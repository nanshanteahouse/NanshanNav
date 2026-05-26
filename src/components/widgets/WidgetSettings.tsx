import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store';
import { Modal } from '@/components/ui/modal';
import { registry } from '@/registry';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetSettingsProps {
  widgetId: string;
  options: Record<string, unknown>;
  onChange: (newOptions: Record<string, unknown>) => void;
  onClose: () => void;
  open: boolean;
}

type SettingsComponentType = React.ComponentType<{
  widgetId: string;
  options: Record<string, unknown>;
  onChange: (newOptions: Record<string, unknown>) => void;
  onDelete: () => void;
}>;

export default function WidgetSettings({ widgetId, options, onChange, onClose, open }: WidgetSettingsProps) {
  const widget = useDashboardStore((s) => s.widgets.find((w) => w.id === widgetId));
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const removeWidgetFromLayouts = useDashboardStore((s) => s.removeWidgetFromLayouts);
  const updateWidget = useDashboardStore((s) => s.updateWidget);
  const [SettingsComponent, setSettingsComponent] = useState<SettingsComponentType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !widget) {
      return;
    }

    const def = registry[widget.type];
    if (!def?.settingsLoader) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettingsComponent(null);
      setLoadError('No settings available for this widget type.');
      return;
    }

    let cancelled = false;

    setLoadError(null);
    def
      .settingsLoader()
      .then((mod) => {
        if (!cancelled) {
          setSettingsComponent(() => mod.default);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load settings';
          setLoadError(message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, widget]);

  const handleDelete = useCallback(() => {
    removeWidget(widgetId);
    removeWidgetFromLayouts(widgetId);
    onClose();
  }, [widgetId, removeWidget, removeWidgetFromLayouts, onClose]);

  const displayTitle = widget?.title || (widget ? registry[widget.type]?.displayName ?? 'Widget' : 'Widget');

  return (
    <Modal open={open} onClose={onClose} title={`Configure ${displayTitle}`}>
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Widget Title
          </label>
          <input
            type="text"
            value={widget?.title ?? ''}
            onChange={(e) => updateWidget(widgetId, { title: e.target.value })}
            className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
            }}
            placeholder={displayTitle}
          />
        </div>

        <div className="border-t pt-5" style={{ borderColor: 'var(--border-default)' }}>
          {loadError ? (
            <div className="p-4 text-center" style={{ color: 'var(--status-offline)' }}>
              {loadError}
            </div>
          ) : SettingsComponent ? (
            <SettingsComponent
              widgetId={widgetId}
              options={options}
              onChange={onChange}
              onDelete={handleDelete}
            />
          ) : (
            <div className="flex items-center justify-center p-8" style={{ color: 'var(--text-muted)' }}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2"
                  style={{
                    borderColor: 'var(--border-default)',
                    borderTopColor: 'var(--accent-primary)',
                  }}
                />
                <span className="text-sm">Loading settings...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-5" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Type: {widget?.type} &middot; ID: {widgetId}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-[var(--status-offline)] w-full justify-center"
            style={{ color: 'var(--status-offline)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Widget
          </Button>
        </div>
      </div>
    </Modal>
  );
}
