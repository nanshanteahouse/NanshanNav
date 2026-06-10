import type { StateCreator } from 'zustand';

export interface UiSlice {
  editMode: boolean;
  sidebarOpen: boolean;
  lastInteractedWidgetId: string | null;
  currentBreakpoint: string;
  setEditMode: (mode: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleEditMode: () => void;
  toggleSidebar: () => void;
  setLastInteractedWidgetId: (id: string | null) => void;
  setCurrentBreakpoint: (bp: string) => void;
}

export const createUiSlice: StateCreator<UiSlice, [], []> = (set) => ({
  editMode: false,
  sidebarOpen: false,
  lastInteractedWidgetId: null,
  currentBreakpoint: 'lg',
  setEditMode: (mode) => set({ editMode: mode, sidebarOpen: mode }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLastInteractedWidgetId: (id) => set({ lastInteractedWidgetId: id }),
  setCurrentBreakpoint: (bp) => set({ currentBreakpoint: bp }),
});
