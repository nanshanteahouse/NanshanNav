import type { WidgetDefinition } from '@/types/widget.ts';

export const clockDefinition: WidgetDefinition<'clock'> = {
  kind: 'clock',
  displayName: '时钟',
  displayKey: 'registry.widget.clock',
  icon: 'Clock',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  defaultOptions: {
    displayMode: 'digital',
    timezone: 'Asia/Shanghai',
    showSeconds: true,
    showDate: true,
    dateFormat: 'YYYY-MM-DD dddd',
    is24Hour: true,
  },
  componentLoader: () => import('@/components/widgets/ClockWidget'),
  settingsLoader: () => import('@/components/widgets/ClockWidget/Settings'),
  requiresServerData: false,
};
