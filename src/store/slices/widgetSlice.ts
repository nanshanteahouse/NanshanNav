import type { StateCreator } from 'zustand';
import type { WidgetConfig } from '@/types/widget.ts';
import { generateId } from '@/lib/utils/generate-id.ts';

export interface WidgetSlice {
  widgets: WidgetConfig[];
  addWidget: (
    config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ) => string;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;
  setWidgets: (widgets: WidgetConfig[]) => void;
}

export const createWidgetSlice: StateCreator<WidgetSlice, [], []> = (set) => ({
  widgets: [],
  addWidget: (config) => {
    const id = generateId();
    const now = new Date().toISOString();

    set((state) => ({
      widgets: [
        ...state.widgets,
        {
          ...config,
          id,
          createdAt: now,
          updatedAt: now,
        } as WidgetConfig,
      ],
    }));

    return id;
  },
  updateWidget: (id, patch) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id
          ? { ...w, ...patch, updatedAt: new Date().toISOString() }
          : w,
      ),
    })),
  removeWidget: (id) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    })),
  setWidgets: (widgets) => set({ widgets }),
});
