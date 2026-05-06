export interface ServiceCard {
  id: string;
  type: 'service';
  name: string;
  url: string;
  description: string;
  iconSource: 'favicon' | 'lucide' | 'custom' | 'initial';
  iconValue: string | null;
  enableStatusCheck: boolean | null;
  openInNewTab: boolean;
}

export interface TextCard {
  id: string;
  type: 'text';
  title: string;
  content: string;
  icon: string;
}

export type Card = ServiceCard | TextCard;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  cards: Card[];
}

export interface SearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface ColorTheme {
  background: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  searchBg: string;
  searchBorder: string;
  categoryTitle: string;
  statusOnline: string;
  statusOffline: string;
}

export interface ColorConfig {
  light: ColorTheme;
  dark: ColorTheme;
}

export interface Settings {
  pageTitle: string;
  showClock: boolean;
  showSearchBar: boolean;
  enableLocalFilter: boolean;
  searchEngines: SearchEngine[];
  enableStatusMonitor: boolean;
  statusCheckInterval: number;
  statusCheckTimeout: number;
  enablePveOverview: boolean;
  pveApiUrl: string;
  pveNodeName: string;
  pveApiToken: string;
  theme: 'light' | 'dark' | 'system';
  colors: ColorConfig;
}

export interface ServicesConfig {
  categories: Category[];
}

export interface AppSettings {
  settings: Settings;
}

export interface AppConfig {
  categories: Category[];
  settings: Settings;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ServiceStatus = 'online' | 'offline' | 'checking' | 'unknown';

export interface StatusMap {
  [serviceId: string]: ServiceStatus;
}

export interface PveStatus {
  status: 'online' | 'offline' | 'unauthorized';
  cpu: number | null;
  memoryUsed: number | null;
  memoryTotal: number | null;
  uptime: number | null;
}

export const DEFAULT_COLORS: ColorConfig = {
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
};

export const DEFAULT_SETTINGS: Settings = {
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
  colors: DEFAULT_COLORS,
};

export const DEFAULT_CATEGORIES: Category[] = [
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
