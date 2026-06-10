import type { StateCreator } from 'zustand';
import type { Snapshot, HistoryEntry } from '@/types/history.ts';
import type { DashboardLayouts } from '@/types/layout.ts';
import type { WidgetConfig } from '@/types/widget.ts';

const EMPTY_LAYOUTS: DashboardLayouts = {
  lg: [], md: [], sm: [], xs: [], xxs: [],
};

/** Accessor interface used to reach widgets/layouts across slices. */
interface HistoryStoreAccess {
  history: HistoryEntry;
  widgets?: WidgetConfig[];
  layouts?: DashboardLayouts;
}

export interface HistorySlice {
  history: HistoryEntry;
  pushSnapshot: (snapshot: Snapshot) => void;
  undo: () => Snapshot | null;
  redo: () => Snapshot | null;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<HistorySlice, [], []> = (set, get) => ({
  history: { past: [], future: [] },

  pushSnapshot: (snapshot) => {
    set((state) => {
      const past = [...state.history.past, snapshot];
      while (past.length > 50) {
        past.shift();
      }
      return {
        history: {
          past,
          future: [],
        },
      };
    });
  },

  undo: () => {
    const full = get() as HistoryStoreAccess;
    if (full.history.past.length === 0) return null;

    const past = [...full.history.past];
    const restored = past.pop()!;

    const currentSnapshot: Snapshot = {
      widgets: full.widgets ?? [],
      layouts: full.layouts ?? EMPTY_LAYOUTS,
    };

    set({
      history: {
        past,
        future: [...full.history.future, currentSnapshot],
      },
    });

    return restored;
  },

  redo: () => {
    const full = get() as HistoryStoreAccess;
    if (full.history.future.length === 0) return null;

    const future = [...full.history.future];
    const restored = future.pop()!;

    const currentSnapshot: Snapshot = {
      widgets: full.widgets ?? [],
      layouts: full.layouts ?? EMPTY_LAYOUTS,
    };

    set({
      history: {
        past: [...full.history.past, currentSnapshot],
        future,
      },
    });

    return restored;
  },

  clearHistory: () => {
    set({ history: { past: [], future: [] } });
  },
});
