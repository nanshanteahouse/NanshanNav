export interface DashboardSettings {
  cellSize: number;
  darkMode: boolean;
  locale: string;
  dashboardTitle: string;
  showGridLines: boolean;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  cellSize: 50,
  darkMode: false,
  locale: 'zh-CN',
  dashboardTitle: 'NanshanNav',
  showGridLines: false,
};
