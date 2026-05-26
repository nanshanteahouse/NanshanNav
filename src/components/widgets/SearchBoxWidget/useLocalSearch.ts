import { useMemo } from 'react';
import { useDashboardStore } from '@/store';
import type { LinkItem } from '@/types/widget.ts';

export function useLocalSearch(query: string): LinkItem[] {
  const widgets = useDashboardStore((s) => s.widgets);

  return useMemo(() => {
    const allLinks: LinkItem[] = [];
    for (const w of widgets) {
      if (w.type === 'web-link') {
        const opts = w.options as Record<string, unknown>;
        const links = (opts.links as LinkItem[] | undefined) ?? [];
        allLinks.push(...links);
      }
    }

    if (!query.trim()) return [];

    const lower = query.toLowerCase();
    return allLinks
      .filter((link) =>
        link.name.toLowerCase().includes(lower) ||
        link.url.toLowerCase().includes(lower) ||
        link.description.toLowerCase().includes(lower),
      )
      .slice(0, 10);
  }, [query, widgets]);
}
