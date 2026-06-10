import type { StateCreator } from 'zustand';
import type { WidgetConfig } from '@/types/widget.ts';
import type { LayoutItem } from '@/types/layout.ts';
import { generateId } from '@/lib/utils/generate-id.ts';
import { COLS, DEFAULT_WIDGET_SIZE } from '@/lib/constants.ts';
import type { LayoutSlice } from './layoutSlice.ts';
import type { ClipboardSlice } from './clipboardSlice.ts';
import type { HistorySlice } from './historySlice.ts';
import type { Snapshot } from '@/types/history.ts';

export interface WidgetSlice {
  widgets: WidgetConfig[];
  addWidget: (
    config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ) => string;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;
  setWidgets: (widgets: WidgetConfig[]) => void;
  duplicateWidget: (id: string, currentBreakpoint: string) => string;
  pasteWidget: (currentBreakpoint: string) => string | null;
}

function snapshotState(full: WidgetSlice & LayoutSlice): Snapshot {
  return {
    widgets: [...full.widgets],
    layouts: JSON.parse(JSON.stringify(full.layouts)),
  };
}

export const createWidgetSlice: StateCreator<WidgetSlice, [], []> = (set, get) => ({
  widgets: [],
  addWidget: (config) => {
    const id = generateId();
    const now = new Date().toISOString();

    const full = get() as WidgetSlice & LayoutSlice & HistorySlice;
    full.pushSnapshot(snapshotState(full));

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
  updateWidget: (id, patch) => {
    const full = get() as WidgetSlice & LayoutSlice & HistorySlice;
    full.pushSnapshot(snapshotState(full));

    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id
          ? { ...w, ...patch, updatedAt: new Date().toISOString() }
          : w,
      ),
    }));
  },
  removeWidget: (id) => {
    const full = get() as WidgetSlice & LayoutSlice & HistorySlice;
    full.pushSnapshot(snapshotState(full));

    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    }));
  },
  setWidgets: (widgets) => set({ widgets }),
  duplicateWidget: (id, currentBreakpoint) => {
    const full = get() as WidgetSlice & LayoutSlice & HistorySlice;
    const source = full.widgets.find((w) => w.id === id);
    if (!source) return '';

    full.pushSnapshot(snapshotState(full));

    const newId = generateId();
    const now = new Date().toISOString();
    const clone = JSON.parse(JSON.stringify(source)) as WidgetConfig;
    clone.id = newId;
    clone.createdAt = now;
    clone.updatedAt = now;

    const cols = (COLS as Record<string, number>)[currentBreakpoint] ?? 12;
    const sourceLayout = (full.layouts as unknown as Record<string, LayoutItem[]>)[
      currentBreakpoint
    ]?.find((l) => l.i === id);

    const newLayoutItem: LayoutItem = sourceLayout
      ? {
          ...sourceLayout,
          i: newId,
          x: Math.min(sourceLayout.x + 2, cols - sourceLayout.w),
          y: sourceLayout.y + 2,
        }
      : { i: newId, x: 0, y: 0, w: 4, h: 4 };

    set((state) => {
      const fullState = state as WidgetSlice & LayoutSlice;
      const bpEntries = (fullState.layouts as unknown as Record<string, LayoutItem[]>)[currentBreakpoint] ?? [];
      return {
        widgets: [...fullState.widgets, clone],
        layouts: {
          ...fullState.layouts,
          [currentBreakpoint]: [...bpEntries, newLayoutItem],
        },
      };
    });

    return newId;
  },
  pasteWidget: (currentBreakpoint) => {
    const full = get() as WidgetSlice & ClipboardSlice & LayoutSlice & HistorySlice;
    const { clipboard } = full;
    if (!clipboard) return null;

    full.pushSnapshot(snapshotState(full));

    const newId = generateId();
    const now = new Date().toISOString();
    const clone = JSON.parse(JSON.stringify(clipboard)) as WidgetConfig;
    clone.id = newId;
    clone.createdAt = now;
    clone.updatedAt = now;

    const bpLayout = (full.layouts as unknown as Record<string, LayoutItem[]>)[currentBreakpoint] ?? [];
    const maxY = bpLayout.reduce((max, l) => Math.max(max, l.y), -1);
    const y = maxY < 0 ? 0 : maxY + 1;
    const defaultSize = DEFAULT_WIDGET_SIZE[clone.type] ?? { w: 4, h: 4 };

    const newLayoutItem: LayoutItem = {
      i: newId,
      x: 0,
      y,
      w: defaultSize.w,
      h: defaultSize.h,
    };

    set((state) => {
      const fullState = state as WidgetSlice & LayoutSlice;
      const bpEntries = (fullState.layouts as unknown as Record<string, LayoutItem[]>)[currentBreakpoint] ?? [];
      return {
        widgets: [...fullState.widgets, clone],
        layouts: {
          ...fullState.layouts,
          [currentBreakpoint]: [...bpEntries, newLayoutItem],
        },
      };
    });

    return newId;
  },
});
