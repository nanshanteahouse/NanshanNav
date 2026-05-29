import type { ComponentType } from 'react';

// ── Widget Type Discriminator ──

export const WIDGET_TYPES = [
  'title-header',
  'markdown-text',
  'web-link',
  'web-page',
  'pve-status',
  'search-box',
  'clock',
  'image',
];

export type WidgetType = (typeof WIDGET_TYPES)[number];

// ── Core Widget Configuration ──

export interface WidgetConfig {
  /** Stable UUID, also used as react-grid-layout key */
  id: string;
  /** Widget type discriminator */
  type: WidgetType;
  /** Display title shown in widget header */
  title: string;
  /** Type-specific configuration object */
  options: Record<string, unknown>;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last modified timestamp (ISO 8601) */
  updatedAt: string;
}

// ── Widget Registry ──

export interface WidgetDefinition<TKind extends WidgetType = WidgetType> {
  /** Unique widget type */
  kind: TKind;
  /** Display name in widget palette (fallback when displayKey is not translated) */
  displayName: string;
  /** i18n key for widget display name (takes precedence over displayName) */
  displayKey?: string;
  /** Icon for palette and card header */
  icon: string;
  /** Default grid dimensions { w, h } */
  defaultSize: { w: number; h: number };
  /** Minimum grid dimensions */
  minSize?: { w: number; h: number };
  /** Default options merged when creating a new widget */
  defaultOptions: Record<string, unknown>;
  /** Dynamic import of the widget React component */
  componentLoader: () => Promise<{ default: ComponentType<WidgetComponentProps> }>;
  /** Dynamic import of the widget settings panel (shown in edit mode) */
  settingsLoader?: () => Promise<{ default: ComponentType<WidgetSettingsProps> }>;
  /** Whether this widget requires server data via TanStack Query */
  requiresServerData: boolean;
}

export type WidgetRegistry = {
  [K in WidgetType]: WidgetDefinition<K>;
};

// ── Widget Component Props ──

export interface WidgetComponentProps {
  widgetId: string;
  options: Record<string, unknown>;
  isEditMode: boolean;
  /** Measured width of the card container in px */
  width: number;
  /** Measured height of the card container in px */
  height: number;
}

export interface WidgetSettingsProps {
  widgetId: string;
  options: Record<string, unknown>;
  onChange: (newOptions: Record<string, unknown>) => void;
  onDelete: () => void;
}

// ── Widget-Specific Options ──

// Title Header
export interface TitleHeaderOptions {
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4';
  textAlign: 'left' | 'center' | 'right';
  showDivider: boolean;
  /** Lucide icon name (PascalCase), empty string means no icon */
  iconName: string;
}

// Markdown Text
export interface MarkdownTextOptions {
  content: string;
}

// Web Link
export interface LinkItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}

export interface WebLinkOptions {
  links: LinkItem[];
  openInNewTab: boolean;
  healthCheckEnabled: boolean;
  healthCheckInterval: number; // seconds, default 60
  showName: boolean;
  showUrl: boolean;
  showDescription: boolean;
}

// PVE Status
export interface PveStatusOptions {
  proxmoxHost: string; // e.g., 'pve.lan:8006'
  nodeName: string; // e.g., 'pve'
  showCpu: boolean;
  showMemory: boolean;
  showUptime: boolean;
  showStorage: boolean;
  showVmCounts: boolean;
  refreshInterval: number; // seconds, default 15
}

// Search Box
export interface SearchBoxOptions {
  defaultEngine: 'google' | 'baidu' | 'bing' | 'duckduckgo' | 'custom';
  customEngineUrl?: string; // e.g., 'https://search.example.com?q={query}'
  enableLocalSearch: boolean;
  placeholder: string;
  ctrlKEnabled: boolean; // enable Ctrl+K hotkey
}

export interface WebPageOptions {
  url: string;
}

// Clock
export interface ClockOptions {
  displayMode: 'analog' | 'digital';
  timezone: string; // IANA timezone, e.g., 'Asia/Shanghai'
  showSeconds: boolean;
  showDate: boolean;
  dateFormat: string; // e.g., 'YYYY-MM-DD dddd'
  is24Hour: boolean;
}

// ── Image ──
export type ImageScaleMode = 'contain' | 'cover' | 'fill' | 'original';
export type ImageAlignX = 'left' | 'center' | 'right';
export type ImageAlignY = 'top' | 'center' | 'bottom';
export type ImageSourceType = 'url' | 'upload';
export type ImageClickAction = 'none' | 'preview' | 'link';

export interface ImageOptions {
  sourceType: ImageSourceType;
  url: string;
  imageData?: string;
  imageStoreKey?: string;
  alt: string;
  scaleMode: ImageScaleMode;
  alignX: ImageAlignX;
  alignY: ImageAlignY;
  caption?: string;
  borderRadius: number;
  showShadow: boolean;
  onClick: ImageClickAction;
  linkUrl?: string;
  openInNewTab: boolean;
}
