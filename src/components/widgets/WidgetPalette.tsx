import type { LucideIcon } from 'lucide-react';
import { Type, FileText, Link, Globe, Server, Search, Clock, Image } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { getWidgetDefinition, getWidgetDefinitionsByGroup } from '@/registry/index';
import { getWidgetDisplayKey } from '@/registry/loaders';
import type { WidgetType } from '@/types/widget';
import { useTranslation } from '@/i18n';

const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  'title-header': Type,
  'markdown-text': FileText,
  'web-link': Link,
  'web-page': Globe,
  'pve-status': Server,
  'search-box': Search,
  'clock': Clock,
  'image': Image,
};

function useWidgetDisplayName(type: WidgetType, t: (key: string) => string): string {
  const displayKey = getWidgetDisplayKey(type);
  if (displayKey) {
    const translated = t(displayKey);
    if (translated !== displayKey) return translated;
  }
  return getWidgetDefinition(type).displayName;
}

export function WidgetPalette() {
  const editMode = useDashboardStore((s) => s.editMode);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const { t } = useTranslation();

  if (!editMode) return null;

  const groups = getWidgetDefinitionsByGroup();

  const handleAddWidget = (type: WidgetType) => {
    const def = getWidgetDefinition(type);
    addWidget({
      type,
      title: '',
      options: { ...def.defaultOptions },
    });
  };

  const handleDragStart = (e: React.DragEvent, type: WidgetType) => {
    e.dataTransfer.setData('widget-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-5" role="region" aria-label={t('sidebar.addWidget')}>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] px-1">
        {t('sidebar.addWidget')}
      </h3>
      {Object.entries(groups).map(([groupKey, types]) => (
        <div key={groupKey}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
            {t(`registry.group.${groupKey}`)}
          </p>
          <div className="space-y-1">
            {types.map((type) => {
              const def = getWidgetDefinition(type);
              const Icon = WIDGET_ICONS[type];
              const displayName = useWidgetDisplayName(type, t);
              return (
                <button
                  key={type}
                  draggable
                  onClick={() => handleAddWidget(type)}
                  onDragStart={(e) => handleDragStart(e, type)}
                  aria-label={t('widgetShell.editControls', { title: displayName })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-[var(--transition-fast)] hover:bg-[var(--bg-widget-hover)] cursor-grab active:cursor-grabbing"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--bg-input)] shrink-0">
                    <Icon className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {displayName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-tight">
                      {def.defaultSize.w}×{def.defaultSize.h} {t('sidebar.cellsSuffix')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-[var(--text-muted)] px-1 pt-1">
        {t('sidebar.clickOrDrag')}
      </p>
    </div>
  );
}
