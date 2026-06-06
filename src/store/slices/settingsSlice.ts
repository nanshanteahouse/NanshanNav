import type { StateCreator } from 'zustand';
import type { DashboardSettings, ThemeMode } from '@/types/dashboard.ts';
import { DEFAULT_SETTINGS } from '@/types/dashboard.ts';

export interface SettingsSlice {
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], []> = (set) => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: (patch) =>
    set((state) => ({
      settings: { ...state.settings, ...patch },
    })),
  setThemeMode: (mode) =>
    set((state) => ({
      settings: { ...state.settings, themeMode: mode },
    })),
});
