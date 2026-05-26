import type { WidgetDefinition } from '@/types/widget.ts';

export const titleHeaderDefinition: WidgetDefinition<'title-header'> = {
  kind: 'title-header',
  displayName: '标题',
  icon: 'Heading',
  defaultSize: { w: 4, h: 1 },
  minSize: { w: 2, h: 1 },
  defaultOptions: {
    headingLevel: 'h2',
    textAlign: 'center',
    showDivider: true,
  },
  componentLoader: () => import('@/components/widgets/TitleHeaderWidget'),
  settingsLoader: () => import('@/components/widgets/TitleHeaderWidget/Settings'),
  requiresServerData: false,
};
