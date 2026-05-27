import type { LucideIcon } from 'lucide-react';
import { Type, FileText, Link, Globe, Server, Search, Clock, Image } from 'lucide-react';
import { useDashboardStore } from '@/store/index';
import { getWidgetDefinition, getWidgetDefinitionsByGroup } from '@/registry/index';
import type { WidgetType } from '@/types/widget';

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

export function WidgetPalette() {
  const editMode = useDashboardStore((s) => s.editMode);
  const addWidget = useDashboardStore((s) => s.addWidget);

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
    <div className="space-y-5" role="region" aria-label="Widget palette">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] px-1">
        Add Widget
      </h3>
      {Object.entries(groups).map(([groupName, types]) => (
        <div key={groupName}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
            {groupName}
          </p>
          <div className="space-y-1">
            {types.map((type) => {
              const def = getWidgetDefinition(type);
              const Icon = WIDGET_ICONS[type];
              return (
                <button
                  key={type}
                  draggable
                  onClick={() => handleAddWidget(type)}
                  onDragStart={(e) => handleDragStart(e, type)}
                  aria-label={`Add ${def.displayName} widget`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-[var(--transition-fast)] hover:bg-[var(--bg-widget-hover)] cursor-grab active:cursor-grabbing"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--bg-input)] shrink-0">
                    <Icon className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {def.displayName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-tight">
                      {def.defaultSize.w}×{def.defaultSize.h} cells
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-[var(--text-muted)] px-1 pt-1">
        Click to add or drag to canvas
      </p>
    </div>
  );
}
