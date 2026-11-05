import type { DashboardSettings } from "../types/dashboard.ts";
import { DEFAULT_SETTINGS } from "../types/dashboard.ts";
import type { DashboardLayouts } from "../types/layout.ts";
import type { WidgetConfig } from "../types/widget.ts";
import { WIDGET_TYPES } from "../types/widget.ts";

export const DASHBOARD_SCHEMA_VERSION = 1;
export interface DashboardDocument {
  schemaVersion: 1;
  settings: DashboardSettings;
  layouts: DashboardLayouts;
  widgets: WidgetConfig[];
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function fail(path: string): never {
  throw new Error(`Invalid dashboard: ${path}`);
}
function safeJson(value: unknown, depth = 0): void {
  if (depth > 20) fail("options nesting");
  if (typeof value === "number" && !Number.isFinite(value))
    fail("non-finite number");
  if (Array.isArray(value)) {
    if (value.length > 10000) fail("array size");
    value.forEach((v) => safeJson(v, depth + 1));
  } else if (isRecord(value))
    for (const [key, entry] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        fail("unsafe key");
      safeJson(entry, depth + 1);
    }
}
const optionStrings = [
  "content",
  "url",
  "alt",
  "altText",
  "caption",
  "imageData",
  "imageStoreKey",
  "linkUrl",
  "placeholder",
  "customEngineUrl",
  "proxmoxHost",
  "proxmoxUrl",
  "hostId",
  "nodeName",
  "timezone",
  "dateFormat",
  "iconName",
];
const optionBooleans = [
  "showDivider",
  "openInNewTab",
  "healthCheckEnabled",
  "showName",
  "showUrl",
  "showDescription",
  "showCpu",
  "showMemory",
  "showUptime",
  "showStorage",
  "showVmCounts",
  "showTitleLink",
  "enableLocalSearch",
  "ctrlKEnabled",
  "showSeconds",
  "showDate",
  "is24Hour",
  "showShadow",
  "shadow",
];
const optionEnums: Record<string, string[]> = {
  headingLevel: ["h1", "h2", "h3", "h4"],
  textAlign: ["left", "center", "right"],
  defaultEngine: ["google", "baidu", "bing", "duckduckgo", "custom"],
  displayMode: ["analog", "digital"],
  sourceType: ["url", "upload"],
  scaleMode: ["contain", "cover", "fill", "original"],
  alignX: ["left", "center", "right"],
  alignY: ["top", "center", "bottom"],
  onClick: ["none", "preview", "link"],
};
// Older exports may omit options added in later releases; normalize before rendering.
const OPTION_DEFAULTS: Record<string, Record<string, unknown>> = {
  "title-header": {
    headingLevel: "h2",
    textAlign: "center",
    showDivider: true,
    iconName: "",
  },
  "markdown-text": { content: "" },
  "web-link": {
    links: [],
    openInNewTab: true,
    healthCheckEnabled: true,
    healthCheckInterval: 60,
    showName: true,
    showUrl: true,
    showDescription: true,
  },
  "web-page": { url: "" },
  "pve-status": {
    proxmoxHost: "",
    nodeName: "pve",
    showCpu: true,
    showMemory: true,
    showUptime: true,
    showStorage: true,
    showVmCounts: true,
    showTitleLink: true,
    refreshInterval: 15,
  },
  "search-box": {
    defaultEngine: "google",
    customEngineUrl: "",
    enableLocalSearch: true,
    placeholder: "",
    ctrlKEnabled: true,
  },
  clock: {
    displayMode: "digital",
    timezone: "Asia/Shanghai",
    showSeconds: true,
    showDate: true,
    dateFormat: "YYYY-MM-DD dddd",
    is24Hour: true,
  },
  image: {
    sourceType: "url",
    url: "",
    alt: "",
    scaleMode: "contain",
    alignX: "center",
    alignY: "center",
    caption: "",
    borderRadius: 8,
    showShadow: false,
    onClick: "none",
    linkUrl: "",
    openInNewTab: true,
  },
};
function validateOptions(options: Record<string, unknown>) {
  for (const key of optionStrings)
    if (key in options && typeof options[key] !== "string")
      fail(`options.${key}`);
  for (const key of optionBooleans)
    if (key in options && typeof options[key] !== "boolean")
      fail(`options.${key}`);
  for (const [key, values] of Object.entries(optionEnums))
    if (key in options && !values.includes(options[key] as string))
      fail(`options.${key}`);
  for (const key of ["healthCheckInterval", "refreshInterval", "borderRadius"])
    if (
      key in options &&
      (typeof options[key] !== "number" ||
        (options[key] as number) < 0 ||
        (options[key] as number) > 86400)
    )
      fail(`options.${key}`);
  if (typeof options.timezone === "string") {
    try {
      new Intl.DateTimeFormat("en", { timeZone: options.timezone });
    } catch {
      fail("options.timezone");
    }
  }
  if ("links" in options) {
    if (!Array.isArray(options.links)) fail("options.links");
    const ids = new Set<string>();
    for (const link of options.links) {
      if (!isRecord(link) || typeof link.id !== "string" || ids.has(link.id))
        fail("link.id");
      ids.add(link.id);
      for (const key of ["name", "url", "icon", "description"])
        if (typeof link[key] !== "string") fail(`link.${key}`);
      if (
        link.tags !== undefined &&
        (!Array.isArray(link.tags) ||
          link.tags.length > 100 ||
          link.tags.some((tag) => typeof tag !== "string" || tag.length > 100))
      )
        fail("link.tags");
      if (
        link.iconSource !== undefined &&
        !["favicon", "lucide", "custom", "initial"].includes(
          link.iconSource as string,
        )
      )
        fail("link.iconSource");
      if (
        link.iconValue !== undefined &&
        link.iconValue !== null &&
        typeof link.iconValue !== "string"
      )
        fail("link.iconValue");
    }
  }
}
/** Validates the entire transaction before producing a detached document. Legacy exports remain readable. */
export function parseDashboard(value: unknown): DashboardDocument {
  if (!isRecord(value)) fail("document");
  safeJson(value);
  if (
    value.schemaVersion !== undefined &&
    value.schemaVersion !== DASHBOARD_SCHEMA_VERSION
  )
    fail("schemaVersion");
  if (value.version !== undefined && value.version !== "1.0.0") fail("version");
  if (
    !isRecord(value.settings) ||
    !isRecord(value.layouts) ||
    !Array.isArray(value.widgets) ||
    value.widgets.length > 1000
  )
    fail("settings/layouts/widgets");
  const raw = { ...value.settings };
  if ("darkMode" in raw && !("themeMode" in raw))
    raw.themeMode = raw.darkMode ? "dark" : "system";
  const settings = { ...DEFAULT_SETTINGS, ...raw };
  if (
    !Number.isFinite(settings.cellSize) ||
    settings.cellSize < 30 ||
    settings.cellSize > 80
  )
    fail("settings.cellSize");
  if (
    !["light", "dark", "system"].includes(settings.themeMode) ||
    typeof settings.locale !== "string" ||
    typeof settings.dashboardTitle !== "string" ||
    settings.dashboardTitle.length > 500 ||
    typeof settings.showGridLines !== "boolean"
  )
    fail("settings");
  if (
    settings.glassEnabled !== undefined &&
    typeof settings.glassEnabled !== "boolean"
  )
    fail("settings.glassEnabled");
  if (
    settings.glassBlur !== undefined &&
    (!Number.isFinite(settings.glassBlur) ||
      settings.glassBlur < 0 ||
      settings.glassBlur > 100)
  )
    fail("settings.glassBlur");
  if (settings.colors !== undefined) {
    if (!isRecord(settings.colors)) fail("settings.colors");
    for (const theme of ["light", "dark"] as const) {
      const colors = settings.colors[theme];
      if (!isRecord(colors)) fail(`settings.colors.${theme}`);
      for (const key of Object.keys(DEFAULT_SETTINGS.colors![theme]))
        if (
          typeof colors[key] !== "string" ||
          !/^#[\da-f]{3,8}$/i.test(colors[key])
        )
          fail(`colors.${key}`);
    }
  }
  const ids = new Set<string>();
  for (const widget of value.widgets) {
    if (
      !isRecord(widget) ||
      typeof widget.id !== "string" ||
      !widget.id ||
      widget.id.length > 200 ||
      ids.has(widget.id)
    )
      fail("widget.id");
    ids.add(widget.id);
    if (
      !(WIDGET_TYPES as readonly string[]).includes(widget.type as string) ||
      typeof widget.title !== "string" ||
      !isRecord(widget.options) ||
      typeof widget.createdAt !== "string" ||
      typeof widget.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(widget.createdAt)) ||
      !Number.isFinite(Date.parse(widget.updatedAt))
    )
      fail("widget");
    validateOptions(widget.options);
  }
  for (const bp of ["lg", "md", "sm", "xs", "xxs"]) {
    const layout = value.layouts[bp];
    if (!Array.isArray(layout) || layout.length > 1000) fail(`layouts.${bp}`);
    const entries = new Set<string>();
    for (const item of layout) {
      if (
        !isRecord(item) ||
        typeof item.i !== "string" ||
        !ids.has(item.i) ||
        entries.has(item.i)
      )
        fail("layout reference");
      entries.add(item.i);
      for (const key of ["x", "y", "w", "h"])
        if (
          !Number.isInteger(item[key]) ||
          (item[key] as number) < (key === "w" || key === "h" ? 1 : 0) ||
          (item[key] as number) > 100000
        )
          fail(`layout.${key}`);
      for (const key of ["minW", "minH", "maxW", "maxH"])
        if (
          item[key] !== undefined &&
          (!Number.isInteger(item[key]) || (item[key] as number) < 1)
        )
          fail(`layout.${key}`);
      if (item.static !== undefined && typeof item.static !== "boolean")
        fail("layout.static");
    }
  }
  return JSON.parse(
    JSON.stringify({
      schemaVersion: 1,
      settings,
      layouts: value.layouts,
      widgets: value.widgets.map((widget) => ({
        ...widget,
        options: { ...OPTION_DEFAULTS[widget.type], ...widget.options },
      })),
    }),
  ) as DashboardDocument;
}
