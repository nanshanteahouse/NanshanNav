import type { WidgetConfig, WidgetType, LinkItem } from '@/types/widget.ts';
import type { DashboardState } from '@/store/index.ts';

export const selectWidgetById =
  (id: string) =>
  (state: DashboardState): WidgetConfig | undefined =>
    state.widgets.find((w) => w.id === id);

export const selectWidgetsByType =
  (type: WidgetType) =>
  (state: DashboardState): WidgetConfig[] =>
    state.widgets.filter((w) => w.type === type);

export const selectAllLinks =
  () =>
  (state: DashboardState): LinkItem[] =>
    state.widgets
      .filter((w) => w.type === 'web-link')
      .flatMap(
        (w) => (w.options as { links?: LinkItem[] }).links ?? [],
      );

export const selectSearchBoxWidgets =
  () =>
  (state: DashboardState): WidgetConfig[] =>
    state.widgets.filter((w) => w.type === 'search-box');
