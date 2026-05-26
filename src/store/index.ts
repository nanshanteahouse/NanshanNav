import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsSlice } from '@/store/slices/settingsSlice.ts';
import { createSettingsSlice } from '@/store/slices/settingsSlice.ts';
import type { LayoutSlice } from '@/store/slices/layoutSlice.ts';
import { createLayoutSlice } from '@/store/slices/layoutSlice.ts';
import type { WidgetSlice } from '@/store/slices/widgetSlice.ts';
import { createWidgetSlice } from '@/store/slices/widgetSlice.ts';
import type { UiSlice } from '@/store/slices/uiSlice.ts';
import { createUiSlice } from '@/store/slices/uiSlice.ts';
import { STORAGE_KEY } from '@/lib/constants.ts';

export type DashboardState = SettingsSlice & UiSlice & LayoutSlice & WidgetSlice;

export const useDashboardStore = create<DashboardState>()(
  persist(
    (...args) => ({
      ...createSettingsSlice(...args),
      ...createUiSlice(...args),
      ...createLayoutSlice(...args),
      ...createWidgetSlice(...args),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        settings: state.settings,
        layouts: state.layouts,
        widgets: state.widgets,
      }),
    },
  ),
);
