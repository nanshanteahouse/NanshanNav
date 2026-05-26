import { useQuery } from '@tanstack/react-query';
import type { WidgetComponentProps, WebLinkOptions, LinkItem } from '@/types/widget.ts';
import { checkLinkHealth } from '@/lib/api/link-health.ts';
import LinkItemCard from './LinkItem.tsx';

export default function WebLinkWidget({ widgetId: _widgetId, options, isEditMode: _isEditMode, width: _width, height: _height }: WidgetComponentProps) {
  const opts = options as unknown as WebLinkOptions;
  const links: LinkItem[] = Array.isArray(opts.links) ? opts.links : [];
  const healthEnabled = opts.healthCheckEnabled;
  const interval = (opts.healthCheckInterval || 60) * 1000;

  const hasLinks = links.length > 0;

  if (!hasLinks) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4 text-center"
        style={{ color: 'var(--text-muted)' }}
        data-widget-type="web-link"
      >
        <p className="text-sm italic">No links configured. Click settings to add links.</p>
      </div>
    );
  }

  const handleClick = (url: string) => {
    if (opts.openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(url);
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col gap-0 overflow-auto"
      data-widget-type="web-link"
    >
      {links.map((link, index) => (
        <div key={link.id || index}>
          {healthEnabled ? (
            <LinkHealthWrapper
              link={link}
              interval={interval}
              onClick={() => handleClick(link.url)}
            />
          ) : (
            <LinkItemCard
              link={link}
              reachable={null}
              onClick={() => handleClick(link.url)}
            />
          )}
          {index < links.length - 1 && (
            <div className="mx-3" style={{ borderBottom: '1px solid var(--border-default)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function LinkHealthWrapper({
  link,
  interval,
  onClick,
}: {
  link: LinkItem;
  interval: number;
  onClick: () => void;
}) {
  const { data: result } = useQuery({
    queryKey: ['link-health', link.url],
    queryFn: () => checkLinkHealth(link.url),
    refetchInterval: interval,
    staleTime: interval * 0.8,
    enabled: !!link.url,
  });

  return (
    <LinkItemCard
      link={link}
      reachable={result ? result.reachable : null}
      onClick={onClick}
    />
  );
}
