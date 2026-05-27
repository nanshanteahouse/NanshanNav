import type { WidgetDefinition } from '@/types/widget.ts';

export const webPageDefinition: WidgetDefinition<'web-page'> = {
  kind: 'web-page',
  displayName: '网页',
  icon: 'Globe',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 1, h: 1 },
  defaultOptions: {
    url: '',
    displayMode: 'auto',
    imageSize: 'contain',
  },
  componentLoader: () => import('@/components/widgets/WebPageWidget'),
  settingsLoader: () => import('@/components/widgets/WebPageWidget/Settings'),
  requiresServerData: false,
};
