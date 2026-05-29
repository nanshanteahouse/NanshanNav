import type { WidgetDefinition } from '@/types/widget.ts';

export const markdownTextDefinition: WidgetDefinition<'markdown-text'> = {
  kind: 'markdown-text',
  displayName: 'Markdown',
  displayKey: 'registry.widget.markdownText',
  icon: 'FileText',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  defaultOptions: {
    content: '# Hello World\n\nWrite your markdown here.',
  },
  componentLoader: () => import('@/components/widgets/MarkdownTextWidget'),
  settingsLoader: () => import('@/components/widgets/MarkdownTextWidget/Settings'),
  requiresServerData: false,
};
