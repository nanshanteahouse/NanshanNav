import type { StateCreator } from 'zustand';
import type { DashboardSettings } from '@/types/dashboard.ts';
import { DEFAULT_SETTINGS } from '@/types/dashboard.ts';

export interface SettingsSlice {
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  toggleDarkMode: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], []> = (set) => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: (patch) =>
    set((state) => ({
      settings: { ...state.settings, ...patch },
    })),
  toggleDarkMode: () =>
    set((state) => ({
      settings: { ...state.settings, darkMode: !state.settings.darkMode },
    })),
});
