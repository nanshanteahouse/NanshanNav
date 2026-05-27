import type { WidgetDefinition } from '@/types/widget.ts';

export const imageDefinition: WidgetDefinition<'image'> = {
  kind: 'image',
  displayName: '图片',
  icon: 'Image',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 1, h: 1 },
  defaultOptions: {
    sourceType: 'url',
    url: '',
    alt: '',
    scaleMode: 'contain',
    alignX: 'center',
    alignY: 'center',
    caption: '',
    borderRadius: 8,
    showShadow: false,
    onClick: 'none',
    linkUrl: '',
    openInNewTab: true,
  },
  componentLoader: () => import('@/components/widgets/ImageWidget'),
  settingsLoader: () => import('@/components/widgets/ImageWidget/Settings'),
  requiresServerData: false,
};
