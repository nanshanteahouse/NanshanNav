import type { Category } from '../types';
import { CardGrid } from './card-grid';
import { getLucideIcon } from '../icon-utils';

interface CategorySectionProps {
  category: Category;
}

export function CategorySection({ category }: CategorySectionProps) {
  const IconComponent = getLucideIcon(category.icon);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: category.color }}>
          <IconComponent size={20} />
        </span>
        <h2
          className="text-lg font-semibold text-[var(--color-category-title)]"
        >
          {category.name}
        </h2>
        <div className="flex-1 h-px bg-[var(--color-card-border)]" />
      </div>
      <CardGrid cards={category.cards} categoryColor={category.color} />
    </section>
  );
}
