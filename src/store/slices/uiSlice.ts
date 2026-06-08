import type { StateCreator } from 'zustand';

export interface UiSlice {
  editMode: boolean;
  sidebarOpen: boolean;
  setEditMode: (mode: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleEditMode: () => void;
  toggleSidebar: () => void;
}

export const createUiSlice: StateCreator<UiSlice, [], []> = (set) => ({
  editMode: false,
  sidebarOpen: false,
  setEditMode: (mode) => set({ editMode: mode, sidebarOpen: mode }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
});
