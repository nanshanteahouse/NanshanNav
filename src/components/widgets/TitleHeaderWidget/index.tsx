import { createElement } from 'react';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WidgetComponentProps, TitleHeaderOptions } from '@/types/widget.ts';
import { useDashboardStore } from '@/store/index';

export default function TitleHeaderWidget({ widgetId, options }: WidgetComponentProps) {
  const opts = options as unknown as TitleHeaderOptions;
  const title = useDashboardStore((s) => s.widgets.find((w) => w.id === widgetId)?.title ?? '');

  const IconComponent: LucideIcon | undefined = opts.iconName
    ? (icons as Record<string, LucideIcon>)[opts.iconName]
    : undefined;

  const headingLabels: Record<string, string> = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
  };

  const headingFontSize =
    opts.headingLevel === 'h1'
      ? 'clamp(1.5rem, 5cqw, 2.5rem)'
      : opts.headingLevel === 'h2'
        ? 'clamp(1.25rem, 4cqw, 2rem)'
        : opts.headingLevel === 'h3'
          ? 'clamp(1.1rem, 3cqw, 1.5rem)'
          : 'clamp(1rem, 2.5cqw, 1.25rem)';

  const headingEl = createElement(
    opts.headingLevel,
    {
      className: 'm-0 leading-tight',
      style: {
        color: 'var(--text-primary)',
        fontWeight: 700,
        fontSize: headingFontSize,
      },
    },
    title || headingLabels[opts.headingLevel],
  );

  return (
    <div className="flex h-full w-full items-center p-4" data-widget-type="title-header">
      <div className="w-full" style={{ textAlign: opts.textAlign }}>
        {IconComponent ? (
          <div className="flex items-center gap-2" style={{ justifyContent: opts.textAlign === 'center' ? 'center' : `flex-${opts.textAlign === 'right' ? 'end' : 'start'}` }}>
            <IconComponent
              className="shrink-0"
              style={{
                width: headingFontSize,
                height: headingFontSize,
                color: 'var(--accent-primary)',
              }}
            />
            {headingEl}
          </div>
        ) : (
          headingEl
        )}
        {opts.showDivider && (
          <hr
            className="mt-2 border-0"
            style={{
              height: '2px',
              backgroundColor: 'var(--border-default)',
              borderRadius: '1px',
            }}
          />
        )}
      </div>
    </div>
  );
}
