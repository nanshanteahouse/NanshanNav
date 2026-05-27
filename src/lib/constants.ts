import type { WidgetType } from '@/types/widget.ts';

export const DEFAULT_CELL_SIZE = 50;
export const CELL_SIZE_MIN = 30;
export const CELL_SIZE_MAX = 80;

export const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export const COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const STORAGE_KEY = 'dashboard-storage';

export const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    urlTemplate: 'https://www.google.com/search?q={query}',
    icon: 'search',
  },
  baidu: {
    name: 'Baidu',
    urlTemplate: 'https://www.baidu.com/s?wd={query}',
    icon: 'search',
  },
  bing: {
    name: 'Bing',
    urlTemplate: 'https://www.bing.com/search?q={query}',
    icon: 'search',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q={query}',
    icon: 'search',
  },
} as const;

export const DEFAULT_WIDGET_SIZE: Record<WidgetType, { w: number; h: number }> = {
  'title-header': { w: 4, h: 2 },
  'markdown-text': { w: 4, h: 4 },
  'web-link': { w: 4, h: 4 },
  'web-page': { w: 4, h: 4 },
  'pve-status': { w: 4, h: 5 },
  'search-box': { w: 4, h: 2 },
  'clock': { w: 4, h: 4 },
  'image': { w: 4, h: 4 },
};
