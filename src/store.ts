import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Category,
  Settings,
  StatusMap,
  PveStatus,
  AppConfig,
} from './types';

interface AppState {
  categories: Category[];
  settings: Settings;
  statusMap: StatusMap;
  pveStatus: PveStatus;
  resolvedTheme: 'light' | 'dark';
  localFilter: string;

  setCategories: (categories: Category[]) => void;
  setSettings: (settings: Settings) => void;
  setConfig: (config: AppConfig) => void;
  setStatusMap: (statusMap: StatusMap) => void;
  setServiceStatus: (id: string, status: StatusMap[string]) => void;
  setPveStatus: (status: PveStatus) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  setLocalFilter: (filter: string) => void;
}

const defaultSettings: Settings = {
  pageTitle: '家庭服务导航',
  showClock: true,
  showSearchBar: true,
  enableLocalFilter: true,
  searchEngines: [
    { id: 'engine_google', name: 'Google', urlTemplate: 'https://www.google.com/search?q={query}', enabled: true, isDefault: true },
    { id: 'engine_baidu', name: '百度', urlTemplate: 'https://www.baidu.com/s?wd={query}', enabled: true, isDefault: false },
    { id: 'engine_bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q={query}', enabled: false, isDefault: false },
    { id: 'engine_ddg', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q={query}', enabled: false, isDefault: false },
  ],
  enableStatusMonitor: false,
  statusCheckInterval: 60,
  statusCheckTimeout: 5,
  enablePveOverview: false,
  pveApiUrl: '',
  pveNodeName: '',
  pveApiToken: '',
  theme: 'system',
  colors: {
    light: {
      background: '#FAFAFA',
      card: '#FFFFFF',
      cardBorder: '#E5E7EB',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      accent: '#3B82F6',
      searchBg: '#FFFFFF',
      searchBorder: '#D1D5DB',
      categoryTitle: '#1A1A1A',
      statusOnline: '#22C55E',
      statusOffline: '#EF4444',
    },
    dark: {
      background: '#0F0F0F',
      card: '#1E1E1E',
      cardBorder: '#333333',
      textPrimary: '#E5E5E5',
      textSecondary: '#999999',
      accent: '#3B82F6',
      searchBg: '#252525',
      searchBorder: '#404040',
      categoryTitle: '#E5E5E5',
      statusOnline: '#22C55E',
      statusOffline: '#EF4444',
    },
  },
};

const defaultCategories: Category[] = [
  {
    id: 'cat_nas',
    name: 'NAS 管理',
    icon: 'hard-drive',
    color: '#3B82F6',
    cards: [
      { id: 'svc_dsm', type: 'service', name: '群晖 DSM', url: 'https://192.168.1.100:5001', description: 'NAS 管理面板', iconSource: 'favicon', iconValue: null, enableStatusCheck: true, openInNewTab: true },
      { id: 'svc_omv', type: 'service', name: 'OpenMediaVault', url: 'http://192.168.1.101:80', description: 'NAS 备用节点', iconSource: 'favicon', iconValue: null, enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_smart_home',
    name: '智能家居',
    icon: 'home',
    color: '#8B5CF6',
    cards: [
      { id: 'svc_ha', type: 'service', name: 'Home Assistant', url: 'http://192.168.1.20:8123', description: '智能家居中枢', iconSource: 'favicon', iconValue: null, enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_monitor',
    name: '监控 / 运维',
    icon: 'activity',
    color: '#EF4444',
    cards: [
      { id: 'svc_grafana', type: 'service', name: 'Grafana', url: 'http://192.168.1.50:3000', description: '监控仪表盘', iconSource: 'lucide', iconValue: 'bar-chart-3', enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_media',
    name: '媒体服务',
    icon: 'play-circle',
    color: '#F59E0B',
    cards: [
      { id: 'svc_plex', type: 'service', name: 'Plex', url: 'http://192.168.1.100:32400', description: '媒体服务器', iconSource: 'lucide', iconValue: 'play', enableStatusCheck: null, openInNewTab: true },
      { id: 'svc_jellyfin', type: 'service', name: 'Jellyfin', url: 'http://192.168.1.100:8096', description: '开源媒体中心', iconSource: 'favicon', iconValue: null, enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_download',
    name: '下载管理',
    icon: 'download',
    color: '#10B981',
    cards: [
      { id: 'svc_qbittorrent', type: 'service', name: 'qBittorrent', url: 'http://192.168.1.100:8080', description: 'BT 下载客户端', iconSource: 'favicon', iconValue: null, enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_router',
    name: '路由 / 网关',
    icon: 'router',
    color: '#6366F1',
    cards: [
      { id: 'svc_openwrt', type: 'service', name: 'OpenWrt', url: 'http://192.168.1.1', description: '路由器管理', iconSource: 'favicon', iconValue: null, enableStatusCheck: null, openInNewTab: true },
    ],
  },
  {
    id: 'cat_dev',
    name: '开发 / 文档',
    icon: 'code-2',
    color: '#14B8A6',
    cards: [],
  },
  {
    id: 'cat_virtual',
    name: '虚拟化',
    icon: 'server',
    color: '#F97316',
    cards: [],
  },
  {
    id: 'cat_web',
    name: '自部署网页',
    icon: 'globe',
    color: '#EC4899',
    cards: [],
  },
  {
    id: 'cat_ai',
    name: 'AI 工具',
    icon: 'sparkles',
    color: '#A855F7',
    cards: [],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      categories: defaultCategories,
      settings: defaultSettings,
      statusMap: {},
      pveStatus: { status: 'online', cpu: null, memoryUsed: null, memoryTotal: null, uptime: null },
      resolvedTheme: 'light',
      localFilter: '',

      setCategories: (categories) => set({ categories }),
      setSettings: (settings) => set({ settings }),
      setConfig: (config) => set({ categories: config.categories, settings: config.settings }),
      setStatusMap: (statusMap) => set({ statusMap }),
      setServiceStatus: (id, status) =>
        set((state) => ({ statusMap: { ...state.statusMap, [id]: status } })),
      setPveStatus: (pveStatus) => set({ pveStatus }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      setLocalFilter: (localFilter) => set({ localFilter }),
    }),
    {
      name: 'web-homepage-store',
      partialize: (state) => ({
        categories: state.categories,
        settings: state.settings,
      }),
    }
  )
);
