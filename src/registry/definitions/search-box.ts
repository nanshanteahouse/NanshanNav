import type { WidgetDefinition } from '@/types/widget.ts';

export const searchBoxDefinition: WidgetDefinition<'search-box'> = {
  kind: 'search-box',
  displayName: '搜索',
  icon: 'Search',
  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  defaultOptions: {
    defaultEngine: 'google',
    customEngineUrl: '',
    enableLocalSearch: true,
    placeholder: '搜索或按 Ctrl+K...',
    ctrlKEnabled: true,
  },
  componentLoader: () => import('@/components/widgets/SearchBoxWidget'),
  settingsLoader: () => import('@/components/widgets/SearchBoxWidget/Settings'),
  requiresServerData: false,
};
