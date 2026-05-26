import { useState } from 'react';
import type { WidgetSettingsProps, WebLinkOptions, LinkItem } from '@/types/widget.ts';
import { generateId } from '@/lib/utils/generate-id.ts';
import { Trash2, Plus } from 'lucide-react';

export default function WebLinkSettings({ widgetId: _widgetId, options, onChange, onDelete }: WidgetSettingsProps) {
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

<div className="flex flex-col gap-5">
          {links.map((link, index) => (
            <div
              key={link.id || index}
              className="rounded-md border p-4"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Link #{index + 1}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                  style={{ color: 'var(--status-offline)' }}
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Name"
                  value={link.name}
                  onChange={(e) => updateLink(index, { name: e.target.value })}
                />
                <input
                  type="text"
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="URL (e.g., https://example.com)"
                  value={link.url}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                />
                <input
                  type="text"
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Icon (lucide icon name)"
                  value={link.icon}
                  onChange={(e) => updateLink(index, { icon: e.target.value })}
                />
                <input
                  type="text"
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Description"
                  value={link.description}
                  onChange={(e) => updateLink(index, { description: e.target.value })}
                />
              </div>
            </div>
          ))}

          {links.length === 0 && (
            <p className="py-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No links yet. Click &quot;Add Link&quot; to get started.
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--status-offline)',
            color: '#fff',
          }}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete Widget
        </button>
      </div>
    </div>
  );
}
