import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import { useTranslation } from '@/i18n';
import type { LinkItem, IconSource } from '@/types/widget';

interface SortableLinkItemProps {
  link: LinkItem;
  index: number;
  onUpdate: (patch: Partial<LinkItem>) => void;
  onRemove: () => void;
}

export default function SortableLinkItem({ link, index, onUpdate, onRemove }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });
  const { t } = useTranslation();

  return (
    <div
      ref={setNodeRef}
      className="rounded-md border p-4"
      style={{
        borderColor: 'var(--border-default)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* GripVertical drag handle — listeners only on this button */}
          <button
            type="button"
            className="cursor-grab p-0.5 rounded hover:bg-[var(--bg-widget-hover)]"
            {...attributes}
            {...listeners}
            aria-label={t('widget.webLink.dragToReorder')}
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Link #{index + 1}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
          style={{ color: 'var(--status-offline)' }}
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>

      {/* Form fields — same layout as Settings.tsx */}
      <div className="flex flex-col gap-2">
        {/* Name */}
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
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        {/* URL */}
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
          onChange={(e) => onUpdate({ url: e.target.value })}
        />
        {/* Icon Picker */}
        <IconPicker
          value={link.icon}
          onChange={(iconName) => onUpdate({ icon: iconName, iconValue: iconName })}
          variant="popover"
        />
        {/* Icon Source Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Icon Source</span>
          <select
            className="rounded border px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            value={link.iconSource || 'lucide'}
            onChange={(e) => onUpdate({ iconSource: e.target.value as IconSource })}
          >
            <option value="favicon">Favicon</option>
            <option value="lucide">Lucide Icon</option>
            <option value="custom">Custom Upload</option>
            <option value="initial">Initial Letter</option>
          </select>
        </div>
        {/* Custom upload field (conditional) */}
        {(link.iconSource || 'lucide') === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Custom Icon</span>
            {link.iconValue ? (
              <div className="flex items-center gap-2">
                <img src={link.iconValue} alt="" className="h-6 w-6 object-contain" />
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--status-offline)' }}
                  onClick={() => onUpdate({ iconValue: null })}
                >
                  Delete
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.url) {
                      onUpdate({ iconValue: data.url });
                    }
                  } catch { /* ignore */ }
                }}
              />
            )}
          </div>
        )}
        {/* Description */}
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
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
