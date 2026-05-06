import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Card } from '../types';

interface SortableCardProps {
  card: Card;
  categoryColor: string;
}

export function SortableCard({ card, categoryColor }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-card-border)] touch-none"
    >
      <button
        className="cursor-grab text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div
        className="w-4 h-4 rounded"
        style={{ backgroundColor: categoryColor }}
      />
      <span className="text-sm text-[var(--color-text-primary)]">
        {card.type === 'service' ? card.name : card.title ?? '文本卡片'}
      </span>
    </div>
  );
}
