import type { WidgetDefinition } from '@/types/widget.ts';

export const webLinkDefinition: WidgetDefinition<'web-link'> = {
  kind: 'web-link',
  displayName: '链接',
  icon: 'Link',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  defaultOptions: {
    links: [],
    openInNewTab: true,
    healthCheckEnabled: true,
    healthCheckInterval: 60,
    showName: true,
    showUrl: true,
    showDescription: true,
  },
  componentLoader: () => import('@/components/widgets/WebLinkWidget'),
  settingsLoader: () => import('@/components/widgets/WebLinkWidget/Settings'),
  requiresServerData: true,
};
