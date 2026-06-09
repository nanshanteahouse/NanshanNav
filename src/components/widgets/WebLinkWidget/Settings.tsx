import { useState } from 'react';
import type { WidgetSettingsProps, WebLinkOptions, LinkItem } from '@/types/widget.ts';
import { generateId } from '@/lib/utils/generate-id.ts';
import { Plus } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@/lib/utils/arrayMove';
import SortableLinkItem from './SortableLinkItem';

export default function WebLinkSettings({ widgetId: _widgetId, options, onChange }: WidgetSettingsProps) {
  const opts = options as unknown as WebLinkOptions;
  const [links, setLinks] = useState<LinkItem[]>(() =>
    Array.isArray(opts.links) ? [...opts.links] : [],
  );
  const [linksSource, setLinksSource] = useState(() => opts.links);

  if (opts.links !== linksSource) {
    setLinksSource(opts.links);
    setLinks(Array.isArray(opts.links) ? [...opts.links] : []);
  }

  const emitChange = (newLinks: LinkItem[], patch?: Partial<WebLinkOptions>) => {
    setLinks(newLinks);
    onChange({ ...opts, links: newLinks, ...patch });
  };

  const addLink = () => {
    const newLink: LinkItem = {
      id: generateId(),
      name: '',
      url: '',
      icon: 'Globe',
      description: '',
    };
    emitChange([...links, newLink]);
  };

  const removeLink = (index: number) => {
    const next = links.filter((_, i) => i !== index);
    emitChange(next);
  };

  const updateLink = (index: number, patch: Partial<LinkItem>) => {
    const next = links.map((link, i) => (i === index ? { ...link, ...patch } : link));
    emitChange(next);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newLinks = arrayMove(links, oldIndex, newIndex);
    emitChange(newLinks);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.openInNewTab}
          onChange={(e) => onChange({ ...opts, openInNewTab: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Open in New Tab
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={opts.healthCheckEnabled}
          onChange={(e) => onChange({ ...opts, healthCheckEnabled: e.target.checked })}
        />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Enable Health Check
        </span>
      </label>

      {opts.healthCheckEnabled && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Health Check Interval (seconds)
          </span>
          <input
            type="number"
            className="rounded-md border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            min={10}
            max={3600}
            value={opts.healthCheckInterval}
            onChange={(e) => onChange({ ...opts, healthCheckInterval: Number(e.target.value) || 60 })}
          />
        </label>
      )}

      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <span className="block mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Display Fields
        </span>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={opts.showName ?? true}
              onChange={(e) => onChange({ ...opts, showName: e.target.checked })}
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Name</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={opts.showUrl ?? true}
              onChange={(e) => onChange({ ...opts, showUrl: e.target.checked })}
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>URL</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={opts.showDescription ?? true}
              onChange={(e) => onChange({ ...opts, showDescription: e.target.checked })}
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Description</span>
          </label>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Links
          </span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
            }}
            onClick={addLink}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-5">
              {links.map((link, index) => (
                <SortableLinkItem key={link.id} link={link} index={index}
                  onUpdate={(patch) => updateLink(index, patch)}
                  onRemove={() => removeLink(index)} />
              ))}
              {links.length === 0 && (
                <p className="py-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No links yet. Click &quot;Add Link&quot; to get started.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
