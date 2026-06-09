export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorTheme {
  bgPrimary: string;
  bgSecondary: string;
  bgWidget: string;
  bgWidgetHover: string;
  bgInput: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  borderDefault: string;
  borderFocus: string;
  statusOnline: string;
  statusOffline: string;
  statusWarning: string;
  accentPrimary: string;
  accentPrimaryHover: string;
}

export interface ColorConfig {
  light: ColorTheme;
  dark: ColorTheme;
}

export const DEFAULT_COLORS: ColorConfig = {
  light: {
    bgPrimary: '#f5f5f7',
    bgSecondary: '#ffffff',
    bgWidget: '#ffffff',
    bgWidgetHover: '#f8f9fa',
    bgInput: '#f0f0f2',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    textAccent: '#2563eb',
    borderDefault: '#e5e7eb',
    borderFocus: '#2563eb',
    statusOnline: '#22c55e',
    statusOffline: '#ef4444',
    statusWarning: '#f59e0b',
    accentPrimary: '#2563eb',
    accentPrimaryHover: '#1d4ed8',
  },
  dark: {
    bgPrimary: '#0f0f1a',
    bgSecondary: '#1a1a2e',
    bgWidget: '#1a1a2e',
    bgWidgetHover: '#222240',
    bgInput: '#16213e',
    textPrimary: '#e8e8ed',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    textAccent: '#60a5fa',
    borderDefault: '#2a2a4a',
    borderFocus: '#60a5fa',
    statusOnline: '#4ade80',
    statusOffline: '#f87171',
    statusWarning: '#fbbf24',
    accentPrimary: '#3b82f6',
    accentPrimaryHover: '#60a5fa',
  },
};

export interface DashboardSettings {
  cellSize: number;
  themeMode: ThemeMode;
  locale: string;
  dashboardTitle: string;
  showGridLines: boolean;
  colors?: ColorConfig;
  glassEnabled?: boolean;
  glassBlur?: number;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  cellSize: 50,
  themeMode: 'system',
  locale: 'zh-CN',
  dashboardTitle: 'NanshanNav',
  showGridLines: false,
  colors: DEFAULT_COLORS,
  glassEnabled: false,
  glassBlur: 10,
};
