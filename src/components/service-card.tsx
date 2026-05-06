import type { ServiceCard, TextCard } from '../types';
import { useStore } from '../store';
import { StatusIndicator } from './status-indicator';
import { IconDisplay } from './icon-display';
import { getLucideIcon } from '../icon-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface ServiceCardProps {
  card: ServiceCard;
  categoryColor: string;
}

export function ServiceCardComponent({ card, categoryColor }: ServiceCardProps) {
  const statusMap = useStore((s) => s.statusMap);
  const enableStatusMonitor = useStore((s) => s.settings.enableStatusMonitor);
  const showStatus = enableStatusMonitor && card.enableStatusCheck !== false;
  const status = showStatus ? statusMap[card.id] : undefined;

  return (
    <a
      href={card.url}
      target={card.openInNewTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] hover:shadow-md hover:border-[var(--color-accent)] transition-shadow duration-200 min-h-[100px]"
    >
      <div className="relative">
        <IconDisplay
          iconSource={card.iconSource}
          iconValue={card.iconValue}
          name={card.name}
          categoryColor={categoryColor}
          url={card.url}
          size={36}
        />
        {showStatus && (
          <div className="absolute -top-1 -right-1">
            <StatusIndicator status={status} />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-[var(--color-text-primary)] text-center leading-tight">
        {card.name}
      </span>
      {card.description && (
        <span className="text-xs text-[var(--color-text-secondary)] text-center line-clamp-1">
          {card.description}
        </span>
      )}
    </a>
  );
}

interface TextCardProps {
  card: TextCard;
  categoryColor: string;
}

export function TextCardComponent({ card, categoryColor }: TextCardProps) {
  const IconComp = card.icon ? getLucideIcon(card.icon) : null;

  return (
    <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)]">
      {(card.title || IconComp) && (
        <div className="flex items-center gap-2 mb-2">
          {IconComp && <IconComp size={16} style={{ color: categoryColor }} />}
          {card.title && (
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{card.title}</h3>
          )}
        </div>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {card.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
