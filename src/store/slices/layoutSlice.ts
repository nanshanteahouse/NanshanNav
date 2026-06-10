import type { StateCreator } from 'zustand';
import type { DashboardLayouts, LayoutItem } from '@/types/layout.ts';

export interface LayoutSlice {
  layouts: DashboardLayouts;
  setLayouts: (layouts: DashboardLayouts) => void;
  updateLayoutForBreakpoint: (
    breakpoint: string,
    layout: LayoutItem[],
  ) => void;
  addLayoutEntry: (breakpoint: string, item: LayoutItem) => void;
  removeWidgetFromLayouts: (widgetId: string) => void;
}

const EMPTY_LAYOUTS: DashboardLayouts = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: [],
};

export const createLayoutSlice: StateCreator<LayoutSlice, [], []> = (set) => ({
  layouts: EMPTY_LAYOUTS,
  setLayouts: (layouts) => set({ layouts }),
  updateLayoutForBreakpoint: (breakpoint, layout) =>
    set((state) => ({
      layouts: { ...state.layouts, [breakpoint]: layout },
    })),
  addLayoutEntry: (breakpoint, item) =>
    set((state) => {
      const layouts = state.layouts as unknown as Record<string, LayoutItem[] | undefined>;
      const existing = layouts[breakpoint] ?? [];
      return {
        layouts: { ...state.layouts, [breakpoint]: [...existing, item] },
      };
    }),
  removeWidgetFromLayouts: (widgetId) =>
    set((state) => {
      const filterItem = (items: LayoutItem[]): LayoutItem[] =>
        items.filter((item) => item.i !== widgetId);

      return {
        layouts: {
          lg: filterItem(state.layouts.lg),
          md: filterItem(state.layouts.md),
          sm: filterItem(state.layouts.sm),
          xs: filterItem(state.layouts.xs),
          xxs: filterItem(state.layouts.xxs),
        },
      };
    }),
});
