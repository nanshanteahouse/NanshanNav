import type { Card, ServiceCard, TextCard } from '../types';
import { ServiceCardComponent, TextCardComponent } from './service-card';

interface CardGridProps {
  cards: Card[];
  categoryColor: string;
}

export function CardGrid({ cards, categoryColor }: CardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {cards.map((card) =>
        card.type === 'service' ? (
          <ServiceCardComponent key={card.id} card={card as ServiceCard} categoryColor={categoryColor} />
        ) : (
          <TextCardComponent key={card.id} card={card as TextCard} categoryColor={categoryColor} />
        )
      )}
    </div>
  );
}
