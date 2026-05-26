# NanshanNav — Home Network Navigation Dashboard

## Specification Document v1.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Design](#3-architecture-design)
4. [Data Model](#4-data-model)
5. [Widget System](#5-widget-system)
6. [Widget Card Specifications](#6-widget-card-specifications)
7. [Grid Layout System](#7-grid-layout-system)
8. [Theme System](#8-theme-system)
9. [PVE Integration](#9-pve-integration)
10. [Search System](#10-search-system)
11. [Project Structure](#11-project-structure)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Project Overview

**NanshanNav** is a self-hosted, customizable home network navigation dashboard. Inspired by Home Assistant's Lovelace dashboard, it provides a drag-and-drop interface where users arrange widget cards on a responsive grid. All widget cards are fully configurable, resizable, and positionable.

### Core Principles

- **Self-hosted** — runs on local network, static SPA with optional backend proxy
- **Cell-grid based** — every widget snaps to a grid; default cell size 50×50px (user-adjustable)
- **Unopinionated layout** — no forced structure; users build dashboards from scratch
- **Config-driven** — all state is serializable JSON; no hardcoded dashboards
- **Day/night mode** — CSS-variable-driven theming with persisted preference

### Widget Cards (v1.0)

| Widget | Description |
|--------|-------------|
| **Title Header** | Section/category heading with configurable text, size, and alignment |
| **Markdown Text** | Arbitrary markdown content rendering (notes, announcements, links) |
| **Web Link** | Hyperlink card: name, URL, icon, description; monitors service reachability via periodic HTTP checks |
| **PVE Status** | Proxmox VE node status display: CPU, memory, uptime, VM/LXC counts via API |
| **Search Box** | Multi-engine search (Google, Baidu, etc.); local-only service search; `Ctrl+K` global hotkey |
| **Clock** | Analog or digital clock with timezone and format settings |

---

## 2. Tech Stack

### Core Stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| **Framework** | React | 19.x | Hooks, React Compiler auto-memo, ecosystem maturity |
| **Build Tool** | Vite | 6.x | Fast HMR, ESM-native, static SPA output |
| **Language** | TypeScript | 5.x | Strict mode, type safety across the widget system |
| **Package Manager** | pnpm | 9.x | Disk-efficient, strict dependency resolution |

### UI & Layout

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Grid Layout** | `react-grid-layout` v2 | 22K stars, pure React, cell-unit grid (`rowHeight`), responsive breakpoints, built-in drag/resize/layout serialization. v2.0 is a complete TypeScript rewrite with hooks-based composable API. |
| **Styling** | Tailwind CSS v4 + CSS Modules | Tailwind for rapid prototyping; CSS Modules for widget-specific styles that need scoping |
| **Component Library** | `shadcn/ui` primitives | Headless, tree-shakeable, themeable via CSS variables |
| **Icons** | `lucide-react` | Consistent icon set, tree-shakeable |

### State Management

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Client State** | Zustand v5 | 1.1KB gzipped, no providers, `persist` middleware for localStorage, selective subscriptions prevent unnecessary re-renders |
| **Server State** | TanStack Query v5 | Caching, deduplication, polling (`refetchInterval`), stale-while-revalidate |
| **Routing** | `react-router` v7 | SPA routing for settings pages (if needed in future) |

### Data Fetching & API

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **HTTP Client** | `fetch` + typed wrappers | No heavy client needed; only 2-3 PVE endpoints |
| **PVE Proxy** | Vite dev proxy + Nginx (production) | PVE's `pveproxy` does not send CORS headers; must proxy via same-origin |

### Dev Tooling

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Code style |
| `vitest` | Unit/integration testing |
| `@testing-library/react` | Component tests |
| `playwright` | E2E tests (future) |

### Why NOT Alternatives

| Rejected | Reason |
|----------|--------|
| **Next.js** | SSR/SSG overkill for a SPA dashboard; adds complexity without benefit |
| **GridStack.js** | jQuery lineage, DOM-attribute API, non-React-native; react-grid-layout v2 is a cleaner React integration |
| **Redux Toolkit** | 11KB gzip, heavy ceremony; Zustand provides equivalent capability at 1/10 the size |
| **Jotai** | Atomic model suited for highly granular derived state; dashboard state is coarser (layout configs, widget settings) — Zustand's flat store is a better fit |
| **CSS-in-JS** | Runtime cost; CSS variables + `data-theme` attribute enable zero-rerender theme switching |

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     App Shell                             │ │
│  │  ┌─────────┐  ┌───────────────────────────────────────┐ │ │
│  │  │ Sidebar │  │            Dashboard Canvas             │ │ │
│  │  │         │  │  ┌─────┐ ┌──────┐ ┌──────┐ ┌───────┐ │ │ │
│  │  │ Widget  │  │  │Clock│ │Links │ │Search│ │ PVE   │ │ │ │
│  │  │ Palette │  │  │     │ │      │ │      │ │ Status│ │ │ │
│  │  │         │  │  └─────┘ └──────┘ └──────┘ └───────┘ │ │ │
│  │  │ Settings│  │  ┌─────────┐ ┌───────────────────────┐ │ │ │
│  │  │         │  │  │Markdown │ │      Title Header     │ │ │ │
│  │  │ Theme   │  │  │ Card    │ │                       │ │ │ │
│  │  │ Toggle  │  │  └─────────┘ └───────────────────────┘ │ │ │
│  │  └─────────┘  └───────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────┐  ┌──────────────────────────────┐    │
│  │   Zustand Store     │  │     TanStack Query Cache      │    │
│  │  ────────────────   │  │  ──────────────────────────  │    │
│  │  layouts            │  │  ['pve', 'status']            │    │
│  │  widgets[]          │  │  ['links', 'health']          │    │
│  │  settings           │  │  ['search', 'engines']        │    │
│  │  editMode           │  └──────────────────────────────┘    │
│  │  darkMode           │                                       │
│  └────────────────────┘                                       │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Component Tree

```
<App>
  <ThemeProvider>              ← sets [data-theme] on <html>
    <QueryClientProvider>
      <DashboardProvider>      ← Zustand store context (edit mode, settings)
        <AppLayout>
          <Sidebar>            ← visible only in edit mode
            <WidgetPalette />  ← add-widget buttons by category
            <DashboardSettings />
          </Sidebar>
          <MainContent>
            <DashboardToolbar> ← edit/save toggle, theme toggle, level-zoom slider
              <CellSizeSlider />   ← adjust cell size (30–80px)
              <ThemeToggle />
              <EditModeToggle />
            </DashboardToolbar>
            <DashboardCanvas>  ← react-grid-layout Responsive
              <WidgetCard key={id} data-grid={layout}>   ← grid item wrapper
                <ErrorBoundary fallback={<WidgetError />}>
                  <Suspense fallback={<WidgetSkeleton />}>
                    <WidgetShell widget={config}>
                      <DynamicWidget />   ← lazy-loaded by widgetType
                    </WidgetShell>
                  </Suspense>
                </ErrorBoundary>
              </WidgetCard>
            </DashboardCanvas>
          </MainContent>
        </AppLayout>
      </DashboardProvider>
    </QueryClientProvider>
  </ThemeProvider>
</App>
```

### 3.3 State Architecture

**Two-layer separation:**

```
┌───────────────────────────────────────────────────────┐
│                   Zustand (Client State)               │
│  Persisted to localStorage via persist middleware      │
│                                                        │
│  Slice: layout    → { lg: Layout[], md: Layout[], ... }│
│  Slice: widgets   → WidgetConfig[]                     │
│  Slice: settings  → { cellSize, darkMode, locale, ... }│
│  Slice: ui        → { editMode, sidebarOpen, ... }     │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│              TanStack Query (Server State)             │
│  Cached in memory, no persistence needed               │
│                                                        │
│  useQuery(['pve', 'status'], ...)    → poll 15s       │
│  useQuery(['pve', 'nodes'], ...)     → poll 10s       │
│  useQuery(['link', id, 'health'],...) → poll 60s       │
└───────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 Widget Configuration

```typescript
/**
 * Unique identifier for widget types.
 * This const tuple ensures type-safety across the entire widget system.
 */
export const WIDGET_TYPES = [
  'title-header',
  'markdown-text',
  'web-link',
  'pve-status',
  'search-box',
  'clock',
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

/**
 * Core widget configuration — serializable JSON.
 */
export interface WidgetConfig {
  /** Stable UUID, also used as react-grid-layout key */
  id: string;
  /** Widget type discriminator */
  type: WidgetType;
  /** Display title shown in widget header (can be empty for e.g. clock) */
  title: string;
  /** Type-specific configuration object */
  options: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string; // ISO 8601
  /** Last modified timestamp */
  updatedAt: string; // ISO 8601
}
```

### 4.2 Layout Configuration

```typescript
/**
 * react-grid-layout v2 layout item.
 * One per widget, per responsive breakpoint.
 */
export interface LayoutItem {
  /** Matches WidgetConfig.id */
  i: string;
  /** Grid column position (0-based) */
  x: number;
  /** Grid row position (0-based) */
  y: number;
  /** Width in grid cells */
  w: number;
  /** Height in grid cells */
  h: number;
  /** Minimum width constraint */
  minW?: number;
  /** Minimum height constraint */
  minH?: number;
  /** Maximum width constraint */
  maxW?: number;
  /** Maximum height constraint */
  maxH?: number;
  /** If true, cannot be dragged or resized (for fixed headers) */
  static?: boolean;
}

/**
 * Layouts keyed by breakpoint name.
 */
export interface DashboardLayouts {
  lg: LayoutItem[];   // >= 1200px - 12 columns
  md: LayoutItem[];   // >= 996px  - 10 columns
  sm: LayoutItem[];   // >= 768px  - 6 columns
  xs: LayoutItem[];   // >= 480px  - 4 columns
  xxs: LayoutItem[];  // < 480px   - 2 columns
}
```

### 4.3 Dashboard Settings

```typescript
export interface DashboardSettings {
  /** Cell size in pixels (default: 50), adjustable 30–80 */
  cellSize: number;
  /** Theme mode */
  darkMode: boolean;
  /** Locale for date/time formatting */
  locale: string; // default: 'zh-CN'
  /** Dashboard title shown in browser tab */
  dashboardTitle: string;
  /** Whether to show the grid background in normal mode */
  showGridLines: boolean;
}
```

### 4.4 Dashboard State (Zustand Store)

```typescript
export interface DashboardState {
  // ── Layout ──
  layouts: DashboardLayouts;
  setLayouts: (layouts: DashboardLayouts) => void;
  updateLayoutForBreakpoint: (breakpoint: string, layout: LayoutItem[]) => void;

  // ── Widgets ──
  widgets: WidgetConfig[];
  addWidget: (config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;

  // ── Settings ──
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  toggleDarkMode: () => void;

  // ── UI ──
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
```

### 4.5 Widget Type-Specific Options

```typescript
// ── Title Header ──
export interface TitleHeaderOptions {
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4';
  textAlign: 'left' | 'center' | 'right';
  showDivider: boolean;
}

// ── Markdown Text ──
export interface MarkdownTextOptions {
  content: string; // raw markdown string
}

// ── Web Link ──
export interface WebLinkOptions {
  url: string;
  description: string;
  icon: string;           // lucide icon name or URL
  openInNewTab: boolean;
  healthCheckEnabled: boolean;
  healthCheckInterval: number; // seconds, default 60
}

// ── PVE Status ──
export interface PveStatusOptions {
  proxmoxHost: string;    // e.g., 'pve.lan:8006'
  nodeName: string;       // e.g., 'pve'
  showCpu: boolean;
  showMemory: boolean;
  showUptime: boolean;
  showStorage: boolean;
  showVmCounts: boolean;
  refreshInterval: number; // seconds, default 15
}

// ── Search Box ──
export interface SearchBoxOptions {
  defaultEngine: 'google' | 'baidu' | 'bing' | 'duckduckgo' | 'custom';
  customEngineUrl?: string;    // e.g., 'https://search.example.com?q={query}'
  enableLocalSearch: boolean;
  placeholder: string;
  ctrlKEnabled: boolean;       // enable Ctrl+K hotkey
}

// ── Clock ──
export interface ClockOptions {
  displayMode: 'analog' | 'digital';
  timezone: string;           // IANA timezone, e.g., 'Asia/Shanghai'
  showSeconds: boolean;
  showDate: boolean;
  dateFormat: string;         // e.g., 'YYYY-MM-DD dddd'
  is24Hour: boolean;
}
```

---

## 5. Widget System

### 5.1 Widget Registry

Following Home Assistant's card registry and Homarr's type-safe definition pattern:

```typescript
/**
 * Every widget must satisfy this contract.
 */
export interface WidgetDefinition<TKind extends WidgetType> {
  /** Unique widget type */
  kind: TKind;
  /** Display name in widget palette */
  displayName: string;
  /** Icon for palette and card header */
  icon: string;
  /** Default grid dimensions { w, h } */
  defaultSize: { w: number; h: number };
  /** Minimum grid dimensions */
  minSize?: { w: number; h: number };
  /** Default options merged when creating a new widget */
  defaultOptions: Record<string, unknown>;
  /** Dynamic import of the widget React component */
  componentLoader: () => Promise<{ default: React.ComponentType<WidgetComponentProps> }>;
  /** Dynamic import of the widget settings panel (shown in edit mode) */
  settingsLoader?: () => Promise<{ default: React.ComponentType<WidgetSettingsProps> }>;
  /** Whether this widget requires server data via TanStack Query */
  requiresServerData: boolean;
}

/**
 * Common props passed to every widget component.
 */
export interface WidgetComponentProps {
  widgetId: string;
  options: Record<string, unknown>;
  isEditMode: boolean;
  /** Measured width of the card container in px */
  width: number;
  /** Measured height of the card container in px */
  height: number;
}

/**
 * Props for widget settings panel (rendered inside edit modal/sidebar).
 */
export interface WidgetSettingsProps {
  widgetId: string;
  options: Record<string, unknown>;
  onChange: (newOptions: Record<string, unknown>) => void;
  onDelete: () => void;
}

/**
 * Type-safe registry — satisfies ensures every WidgetType is covered.
 */
export type WidgetRegistry = {
  [K in WidgetType]: WidgetDefinition<K>;
};
```

### 5.2 Widget Lifecycle

```
┌───────────────────────────────────────────────────────┐
│  1. Registration                                      │
│     WidgetRegistry entry created with all metadata    │
│     Component loaded via React.lazy + dynamic import  │
└───────────────────┬───────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│  2. Instantiation                                     │
│     User clicks "Add Widget" in palette               │
│     WidgetConfig created with UUID + defaultOptions   │
│     LayoutItem inserted at (0, 0) with defaultSize    │
└───────────────────┬───────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│  3. Rendering                                         │
│     WidgetCard reads config from Zustand              │
│     WidgetShell wraps with common frame + controls    │
│     DynamicWidget lazy-loaded and mounted             │
│     (If requiresServerData) TanStack Query fires      │
└───────────────────┬───────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│  4. Interaction (edit mode)                           │
│     Drag: react-grid-layout onChange → updateLayout   │
│     Resize: react-grid-layout onResize → updateLayout │
│     Configure: settings panel → updateWidget          │
│     Delete: removeWidget + remove from all layouts    │
└───────────────────┬───────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│  5. Persistence                                       │
│     Zustand persist middleware auto-saves to          │
│     localStorage on every change (debounced 500ms)    │
│     Future: export/import JSON file, sync to backend  │
└───────────────────────────────────────────────────────┘
```

### 5.3 WidgetShell Component

Every widget is wrapped in a shell that provides consistent UX:

```tsx
function WidgetShell({ widget, children }: {
  widget: WidgetConfig;
  children: React.ReactNode;
}) {
  return (
    <div className="widget-shell" data-widget-id={widget.id}>
      {/* Drag handle — only visible in edit mode */}
      {isEditMode && (
        <div className="widget-header drag-handle">
          <GripVertical className="h-4 w-4" />
          <span className="widget-title">{widget.title || registry[widget.type].displayName}</span>
          <div className="widget-controls">
            <SettingsButton onClick={openSettings} />
            <DeleteButton onClick={removeWidget} />
          </div>
        </div>
      )}

      {/* Widget content */}
      <div className="widget-body">
        <ErrorBoundary fallback={<WidgetError widgetId={widget.id} />}>
          <Suspense fallback={<WidgetSkeleton />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
```

### 5.4 Real-Time Data Strategy

Each widget manages its own data lifecycle independently — the grid container never re-renders for data updates.

| Widget | Data Source | Update Strategy |
|--------|------------|----------------|
| **Clock** | `Date.now()` | `setInterval` every 1s or 60s depending on `showSeconds`. Aligned to real clock ticks using `setTimeout` offset. |
| **PVE Status** | PVE API proxy | TanStack Query `refetchInterval: 15000`. Paused when `document.hidden`. |
| **Web Link Health** | HTTP HEAD request to link URL | TanStack Query `refetchInterval: 60000`. Parallel requests per link via `Promise.allSettled`. |
| **Markdown Text** | None (static content) | No updates. Renders once. |
| **Search Box** | None (triggers navigation) | No updates. Input-only. |
| **Title Header** | None (static content) | No updates. Renders once. |

**Key principle:** TanStack Query deduplicates identical requests. If two PVE widgets query the same node, only one network request fires.

---

## 6. Widget Card Specifications

### 6.1 Title Header

```
┌──────────────────────────────────────┐
│                                      │
│         📌 Section Title             │
│         ─────────────────            │
│                                      │
└──────────────────────────────────────┘
```

- **Configurable**: heading level (h1-h4), text alignment, optional divider line
- **Default size**: 4×1 cells (200×50px at default cell size)
- **Min size**: 2×1
- **Static by default**: not draggable in normal mode (becomes draggable in edit mode)
- **No data dependency** — pure presentational

### 6.2 Markdown Text

```
┌──────────────────────────────────────┐
│ 📝 Notes                     [edit] │
│                                      │
│  ## Welcome                         │
│  - [PVE Dashboard](https://...)      │
│  - **NAS**: \\\\192.168.1.100        │
│                                      │
│  > *Last updated 2026-05-26*        │
│                                      │
└──────────────────────────────────────┘
```

- **Rendering**: Use `react-markdown` with `remark-gfm` (tables, strikethrough, task lists)
- **Editing**: Clicking edit opens a textarea (or modal for large content)
- **Sanitization**: Strip `<script>`, `<iframe>` tags; allow safe HTML subset
- **Default size**: 4×4 cells (200×200px)
- **Min size**: 2×2

### 6.3 Web Link

```
┌──────────────────────────────────────┐
│ 🔗 Services                          │
│                                      │
│  ┌──────┐  🟢 Proxmox VE            │
│  │ 🖥️  │  Virtualization platform    │
│  └──────┘  https://pve.lan:8006     │
│                                      │
│  ┌──────┐  🟢 NAS Dashboard         │
│  │ 💾  │  Synology DSM              │
│  └──────┘  https://nas.lan:5001     │
│                                      │
│  ┌──────┐  🔴 Pi-hole Admin         │
│  │ 🛡️  │  DNS filtering             │
│  └──────┘  https://pi.hole/admin    │
│                                      │
└──────────────────────────────────────┘
```

- **Multiple links** per card — each is a clickable card within the widget
- **Health check**: Periodic HTTP HEAD to each URL; green dot = 2xx response, red dot = error/timeout
- **Icon**: User selects from lucide icon list or provides custom image URL
- **Open behavior**: Configurable new tab vs same tab
- **Default size**: 4×4 cells
- **Min size**: 2×2
- **Data dependency**: Link health checks via TanStack Query (per-link query keys)

**Internal data model for link items (stored in widget's `options`):**

```typescript
interface LinkItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}
// Stored as: options.links = LinkItem[]
```

### 6.4 PVE Status

```
┌──────────────────────────────────────┐
│ 🖥️ Proxmox VE — pve                  │
│                                      │
│  CPU Usage                           │
│  ████████████░░░░░░░░  45.2%         │
│                                      │
│  Memory                             │
│  ██████████░░░░░░░░░░  12.4/32 GB   │
│                                      │
│  Uptime: 14d 6h 32m                  │
│                                      │
│  VMs: 3 running / 2 stopped          │
│  LXCs: 5 running                     │
└──────────────────────────────────────┘
```

- **Data source**: `GET /api2/json/nodes/{node}/status` via backend proxy
- **Display**: Progress bars for CPU/memory, formatted uptime, VM/LXC counts
- **Auto-refresh**: Configurable interval (default 15s), paused when tab hidden
- **Error state**: Shows "Connection error" with last successful fetch time if PVE unreachable
- **Default size**: 4×5 cells (200×250px)
- **Min size**: 3×4
- **Data dependency**: TanStack Query with `refetchInterval`

### 6.5 Search Box

```
┌──────────────────────────────────────┐
│  🔍                                  │
│  ┌──────────────────────────────────┐│
│  │ Search or Ctrl+K...              ││
│  └──────────────────────────────────┘│
│  [🌐 Google] [🔍 Baidu] [📋 Local]  │
└──────────────────────────────────────┘
```

- **Ctrl+K**: Global keyboard shortcut focuses the search input, even if other elements are focused
- **Search engines**: Dropdown or tab buttons to switch between Google, Baidu, Bing, DuckDuckGo, Custom
- **Custom engine**: Template URL with `{query}` placeholder, e.g., `https://search.example.com/?q={query}`
- **Local search**: Filter through stored link items by name/URL/description; shows dropdown suggestions
- **Default size**: 4×2 cells (200×100px)
- **Min size**: 2×2
- **No data dependency** (local search reads from Zustand widgets state)

### 6.6 Clock

```
┌──────────────────────────────────────┐
│                                      │
│          ⬤       ⬤                  │
│        ⬤           ⬤       Analog   │
│       ⬤      ●      ⬤              │
│        ⬤           ⬤                │
│          ⬤       ⬤                  │
│                                      │
│         14:32:05                     │
│      2026-05-26 Tuesday             │
│                                      │
└──────────────────────────────────────┘
```

- **Display modes**: Analog (SVG/CSS clock face) or Digital (text)
- **Timezone**: IANA timezone selector (e.g., `Asia/Shanghai`, `America/New_York`)
- **Format options**: 12/24 hour, show/hide seconds, show/hide date, configurable date format
- **Update**: `setInterval` aligned to real clock ticks — updates every 1s (with seconds) or 60s (without)
- **Default size**: 4×4 cells (200×200px) for analog, 3×2 (150×100px) for digital
- **Min size**: 2×2
- **No data dependency** — pure `Date` API

---

## 7. Grid Layout System

### 7.1 react-grid-layout v2 Configuration

```typescript
import { Responsive, useContainerWidth, useResponsiveLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

function DashboardCanvas() {
  const { width, containerRef, mounted } = useContainerWidth();
  const cellSize = useDashboardStore(s => s.settings.cellSize);
  const editMode = useDashboardStore(s => s.editMode);

  const { layout, breakpoint, setLayoutForBreakpoint } = useResponsiveLayout({
    width,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    layouts: savedLayouts,
    onLayoutChange: (currentLayout, allLayouts) => {
      updateLayoutForBreakpoint(breakpoint, currentLayout);
    },
  });

  if (!mounted) return null;

  return (
    <div ref={containerRef}>
      <Responsive
        layout={layout}
        gridConfig={{
          cols: cols[breakpoint],
          rowHeight: cellSize,     // maps to user's "cell size" concept
        }}
        dragConfig={{
          enabled: editMode,
          handle: '.drag-handle', // only header is draggable
        }}
        resizeConfig={{
          enabled: editMode,
        }}
      >
        {widgets.map(widget => (
          <div key={widget.id} className="grid-item">
            <WidgetCard widget={widget} />
          </div>
        ))}
      </Responsive>
    </div>
  );
}
```

### 7.2 Cell Size Adjustment

- **Default**: 50px × 50px
- **Range**: 30px – 80px (slider in toolbar)
- **Effect**: Changes `rowHeight` in gridConfig; all widgets scale proportionally
- **Persistence**: Saved in Zustand `settings.cellSize`, persisted to localStorage

### 7.3 Responsive Breakpoints

| Breakpoint | Min Width | Columns | Typical Widget Width |
|------------|-----------|---------|---------------------|
| `xxs` | 0px | 2 | 1 cell (mobile) |
| `xs` | 480px | 4 | 2 cells |
| `sm` | 768px | 6 | 3 cells |
| `md` | 996px | 10 | 4 cells |
| `lg` | 1200px | 12 | 4-6 cells |

Layouts are stored **per breakpoint** — each breakpoint has its own independent arrangement.

### 7.4 Drag & Drop Behavior

| Mode | Drag | Resize | Widget Controls |
|------|------|--------|----------------|
| **View mode** | ❌ Disabled | ❌ Disabled | ❌ Hidden |
| **Edit mode** | ✅ Enabled (`.drag-handle`) | ✅ Enabled (corner handles) | ✅ Visible |

- **Drag handle**: Only the widget header area is draggable, preventing accidental moves
- **Grid snapping**: Widgets snap to cell boundaries automatically
- **Collision**: react-grid-layout pushes widgets out of the way (no overlap)
- **Undo**: Simple undo via Zustand state snapshot (future enhancement)

### 7.5 Empty State

When no widgets exist:

```
┌──────────────────────────────────────────────┐
│                                              │
│           🏠 Welcome to NanshanNav            │
│                                              │
│     Your dashboard is empty.                 │
│     Click "Edit" to start adding widgets.    │
│                                              │
│           [Start Editing]                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 8. Theme System

### 8.1 Architecture

CSS custom properties on `[data-theme]` attribute — **zero React re-renders on theme switch**. Only the toggle button component re-renders.

```
index.html <html data-theme="dark|light">
  └── :root or [data-theme="light"]  → light tokens
  └── [data-theme="dark"]            → dark tokens
      └── All components consume var(--token-name)
```

### 8.2 Theme Tokens

```css
/* ── Light Theme (default) ── */
:root,
[data-theme="light"] {
  /* Background */
  --bg-primary: #f5f5f7;
  --bg-secondary: #ffffff;
  --bg-widget: #ffffff;
  --bg-widget-hover: #f8f9fa;
  --bg-input: #f0f0f2;

  /* Text */
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --text-accent: #2563eb;

  /* Borders */
  --border-default: #e5e7eb;
  --border-focus: #2563eb;

  /* Status */
  --status-online: #22c55e;
  --status-offline: #ef4444;
  --status-warning: #f59e0b;

  /* Accent */
  --accent-primary: #2563eb;
  --accent-primary-hover: #1d4ed8;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-widget: 0 1px 3px rgba(0, 0, 0, 0.08);

  /* Misc */
  --radius-default: 12px;
  --transition-fast: 150ms ease;
}

/* ── Dark Theme ── */
[data-theme="dark"] {
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-widget: #1a1a2e;
  --bg-widget-hover: #222240;
  --bg-input: #16213e;

  --text-primary: #e8e8ed;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --text-accent: #60a5fa;

  --border-default: #2a2a4a;
  --border-focus: #60a5fa;

  --status-online: #4ade80;
  --status-offline: #f87171;
  --status-warning: #fbbf24;

  --accent-primary: #3b82f6;
  --accent-primary-hover: #60a5fa;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-widget: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

### 8.3 Theme Toggle Implementation

```typescript
// ThemeProvider.tsx
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useDashboardStore(s => s.settings.darkMode);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [darkMode]);

  return <>{children}</>;
}
```

### 8.4 FOUC Prevention (Flash of Unstyled Content)

Inline script in `index.html` `<head>` to apply theme before first paint:

```html
<script>
  (function() {
    try {
      var stored = localStorage.getItem('dashboard-storage');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed.state && parsed.state.settings && parsed.state.settings.darkMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      }
    } catch(e) {}
  })();
</script>
```

### 8.5 User-Defined Theme (Future Enhancement)

- Store `primaryColor`, `backgroundColor`, `widgetRadius` in `DashboardSettings`
- Dynamically inject CSS custom properties on mount
- Provide a theme editor in settings panel

---

## 9. PVE Integration

### 9.1 Architecture

```
Browser (SPA)                Vite/Nginx Proxy              Proxmox VE
─────────────               ─────────────────              ───────────
fetch('/api/pve/       →    proxy_pass to              →  GET /api2/json/
  nodes/pve/status')        https://pve.lan:8006          nodes/pve/status
                            + Authorization header         8006 (HTTPS)
```

**Why proxy is required:** Proxmox VE's `pveproxy` does **not** set `Access-Control-Allow-Origin` headers. Direct browser-to-PVE requests are blocked by CORS. The proxy runs same-origin so CORS is irrelevant.

### 9.2 API Endpoints

| Endpoint | Method | Purpose | Poll Interval |
|----------|--------|---------|---------------|
| `/api/pve/nodes` | GET | List all nodes with summary status | 10s |
| `/api/pve/nodes/{node}/status` | GET | Full node status (CPU, memory, uptime, storage, load) | 15s |
| `/api/pve/cluster/resources` | GET | All cluster resources (VMs, LXCs, storage) | 30s |

### 9.3 Authentication

**API Token** (recommended for headless dashboards):
- Header: `Authorization: PVEAPIToken=monitor@pve!dashboard=<secret>`
- No CSRF token needed
- No expiration
- Must be created with `PVEAuditor` role and `--privsep 1`

```bash
# On PVE host:
pveum user add monitor@pve
pveum user token add monitor@pve dashboard -privsep 1
pveum acl modify / -token 'monitor@pve!dashboard' -role PVEAuditor
```

### 9.4 Development Proxy (Vite)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/pve': {
        target: 'https://pve.lan:8006',
        changeOrigin: true,
        secure: false, // self-signed cert in homelab
        rewrite: (path) => path.replace(/^\/api\/pve/, '/api2/json'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'Authorization',
              `PVEAPIToken=${process.env.VITE_PVE_API_TOKEN}`
            );
          });
        },
      },
    },
  },
});
```

### 9.5 Production Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name nav.lan;

    ssl_certificate /etc/ssl/certs/nav.lan.crt;
    ssl_certificate_key /etc/ssl/private/nav.lan.key;

    # Serve SPA
    root /var/www/nanshan-nav;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy PVE API
    location /api/pve/ {
        proxy_pass https://pve.lan:8006/api2/json/;
        proxy_set_header Authorization "PVEAPIToken=monitor@pve!dashboard=YOUR_TOKEN";
        proxy_ssl_verify off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

### 9.6 TypeScript Types for PVE Responses

```typescript
// Full node status response
interface PveNodeStatus {
  uptime: number;          // seconds
  cpu: number;             // fraction 0.0–1.0 (multiply by 100 for %)
  loadavg: [string, string, string]; // 1min, 5min, 15min
  cpuinfo: {
    cores: number;
    cpus: number;
    model: string;
    sockets: number;
  };
  memory: {
    free: number;          // bytes
    total: number;
    used: number;
  };
  swap: {
    free: number;
    total: number;
    used: number;
  };
  rootfs: {
    free: number;
    total: number;
    used: number;
    avail: number;
  };
  pveversion: string;
  'current-kernel': {
    sysname: string;
    release: string;
    version: string;
    machine: string;
  };
  'boot-info': {
    mode: 'efi' | 'legacy-bios';
    secureboot?: boolean;
  };
  ksm?: { shared: number };
  idle: number;
  wait: number;
}

// Cluster resources (for VM/LXC counts)
interface PveClusterResource {
  type: 'node' | 'qemu' | 'lxc' | 'storage';
  node?: string;
  id: string;
  status: string;         // 'running' | 'stopped'
  name?: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  uptime?: number;
}
```

---

## 10. Search System

### 10.1 Global Search (Web Engines)

| Engine | URL Template |
|--------|-------------|
| Google | `https://www.google.com/search?q={query}` |
| Baidu | `https://www.baidu.com/s?wd={query}` |
| Bing | `https://www.bing.com/search?q={query}` |
| DuckDuckGo | `https://duckduckgo.com/?q={query}` |
| Custom | User-defined template with `{query}` placeholder |

### 10.2 Local Search

Searches across all `web-link` widgets' link items:

```typescript
function useLocalSearch(query: string): LinkItem[] {
  const widgets = useDashboardStore(s => s.widgets);
  const allLinks = widgets
    .filter(w => w.type === 'web-link')
    .flatMap(w => (w.options as WebLinkOptions).links || []);

  if (!query.trim()) return [];

  const lower = query.toLowerCase();
  return allLinks.filter(link =>
    link.name.toLowerCase().includes(lower) ||
    link.url.toLowerCase().includes(lower) ||
    link.description.toLowerCase().includes(lower)
  ).slice(0, 10);
}
```

### 10.3 Ctrl+K Hotkey

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      // Focus the search input (find the first search-box widget's input)
      const searchInput = document.querySelector<HTMLInputElement>(
        '[data-widget-type="search-box"] input[type="text"]'
      );
      searchInput?.focus();
    }
    // Escape to blur
    if (e.key === 'Escape') {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

## 11. Project Structure

```
NanshanNav/
├── index.html                    # SPA entry point, FOUC prevention script
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts               # Vite config + PVE dev proxy
├── tailwind.config.ts           # Tailwind + theme tokens extension
├── postcss.config.js
├── eslint.config.js
├── .gitignore
├── .env.example                 # VITE_PVE_API_TOKEN=user@pve!tokenid=secret
├── SPEC.md                      # This document
├── README.md
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                 # React entry + QueryClient + ThemeProvider
│   ├── App.tsx                  # DashboardProvider + AppLayout
│   ├── vite-env.d.ts
│   │
│   ├── styles/
│   │   ├── globals.css          # Tailwind directives + theme tokens
│   │   └── widgets.css          # Widget card shell styles
│   │
│   ├── types/
│   │   ├── dashboard.ts         # DashboardState, DashboardSettings
│   │   ├── widget.ts            # WidgetConfig, WidgetType, WidgetDefinition
│   │   ├── layout.ts            # LayoutItem, DashboardLayouts
│   │   └── pve.ts               # PveNodeStatus, PveClusterResource
│   │
│   ├── store/
│   │   ├── index.ts             # Combined Zustand store with persist
│   │   ├── slices/
│   │   │   ├── layoutSlice.ts
│   │   │   ├── widgetSlice.ts
│   │   │   ├── settingsSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── selectors.ts         # Memoized selectors
│   │
│   ├── registry/
│   │   ├── index.ts             # WidgetRegistry type-safe record
│   │   ├── definitions/         # WidgetDefinition<T> for each widget
│   │   │   ├── title-header.ts
│   │   │   ├── markdown-text.ts
│   │   │   ├── web-link.ts
│   │   │   ├── pve-status.ts
│   │   │   ├── search-box.ts
│   │   │   └── clock.ts
│   │   └── loaders.ts           # loadWidgetDynamic(), caching logic
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DashboardToolbar.tsx
│   │   │   └── DashboardCanvas.tsx    # react-grid-layout wrapper
│   │   │
│   │   ├── widgets/
│   │   │   ├── WidgetShell.tsx        # Common card wrapper
│   │   │   ├── WidgetCard.tsx         # Grid item + shell + lazy load
│   │   │   ├── WidgetError.tsx        # Error boundary fallback
│   │   │   ├── WidgetSkeleton.tsx     # Loading skeleton
│   │   │   ├── WidgetPalette.tsx      # Add-widget drawer
│   │   │   ├── WidgetSettings.tsx     # Settings modal/panel
│   │   │   │
│   │   │   ├── TitleHeaderWidget/
│   │   │   │   ├── index.tsx
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── MarkdownTextWidget/
│   │   │   │   ├── index.tsx
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── WebLinkWidget/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── LinkItem.tsx
│   │   │   │   ├── HealthIndicator.tsx
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── PveStatusWidget/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── CpuBar.tsx
│   │   │   │   ├── MemoryBar.tsx
│   │   │   │   ├── UptimeDisplay.tsx
│   │   │   │   ├── usePveStatus.ts     # TanStack Query hook
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── SearchBoxWidget/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── SearchSuggestions.tsx
│   │   │   │   ├── useLocalSearch.ts
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   └── ClockWidget/
│   │   │       ├── index.tsx
│   │   │       ├── AnalogClock.tsx
│   │   │       ├── DigitalClock.tsx
│   │   │       ├── useCurrentTime.ts
│   │   │       └── Settings.tsx
│   │   │
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   │
│   │   └── common/
│   │       ├── ThemeToggle.tsx
│   │       ├── EditModeToggle.tsx
│   │       └── CellSizeSlider.tsx
│   │
│   ├── hooks/
│   │   ├── useElementSize.ts         # Measure widget card dimensions
│   │   ├── useContainerWidth.ts      # (from react-grid-layout, re-exported)
│   │   └── useKeyboardShortcut.ts    # Ctrl+K handler
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── pve.ts               # PVE API client (fetch wrappers)
│   │   │   └── link-health.ts      # HTTP HEAD health check
│   │   ├── utils/
│   │   │   ├── generate-id.ts       # nanoid wrapper
│   │   │   ├── format-uptime.ts     # seconds → "14d 6h 32m"
│   │   │   └── format-bytes.ts      # bytes → "12.4 GB"
│   │   └── constants.ts             # Default settings, breakpoints, etc.
│   │
│   └── __tests__/
│       ├── store/
│       │   └── widgetSlice.test.ts
│       ├── components/
│       │   └── WidgetShell.test.tsx
│       └── lib/
│           └── pve.test.ts
│
└── e2e/                              # (future) Playwright E2E tests
    └── dashboard.spec.ts
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

- [ ] Scaffold Vite + React + TypeScript project
- [ ] Configure Tailwind CSS v4, PostCSS
- [ ] Set up ESLint, Prettier
- [ ] Create Zustand store with `persist` middleware
- [ ] Implement theme system (`[data-theme]` + FOUC script)
- [ ] Set up react-grid-layout v2 with `DashboardCanvas`
- [ ] Build `WidgetShell`, `WidgetSkeleton`, `WidgetError` components
- [ ] Implement widget registry and lazy loading system
- [ ] Build `DashboardToolbar` (edit mode toggle, theme toggle, cell size slider)
- [ ] Build `Sidebar` with `WidgetPalette`
- [ ] Implement "Add Widget" flow (palette → create config → insert into grid)

**Deliverable**: Empty dashboard with edit mode, drag-drop working, theme toggle functional.

### Phase 2: Static Widgets

- [ ] **Clock Widget** — Analog + Digital displays, timezone support, `useCurrentTime` hook
- [ ] **Title Header Widget** — Configurable heading, alignment, divider
- [ ] **Markdown Text Widget** — `react-markdown` rendering, edit mode with textarea
- [ ] Widget settings panels for each widget
- [ ] Widget delete flow (remove from store + layout cleanup)

**Deliverable**: Three static widgets fully functional.

### Phase 3: Data-Driven Widgets

- [ ] **PVE Proxy** — Vite dev proxy configuration, typed API client
- [ ] **PVE Status Widget** — TanStack Query integration, progress bars, formatted uptime
- [ ] **Web Link Widget** — Link item CRUD, icon picker, link health check system
- [ ] **Search Box Widget** — Multi-engine search, local search, Ctrl+K hotkey
- [ ] Nginx production config for PVE proxy

**Deliverable**: All six widgets fully functional with real data.

### Phase 4: Polish

- [ ] Responsive layout testing across breakpoints
- [ ] Empty state / welcome screen
- [ ] Export/import dashboard config as JSON
- [ ] Widget drag-from-palette (drag new widget onto canvas)
- [ ] Grid background lines toggle
- [ ] Performance optimization (lazy load, memoization, bundle splitting)
- [ ] Accessibility (keyboard navigation, ARIA labels, focus management)

### Phase 5: Future Enhancements (post-v1)

- [ ] Multiple dashboard pages/tabs
- [ ] User-defined themes (custom colors, border radius)
- [ ] Backend service for multi-user support and config sync
- [ ] WebSocket-based real-time updates for PVE (instead of polling)
- [ ] More widgets: weather, RSS feed, Docker status, network speed test
- [ ] Mobile PWA support
- [ ] Docker image for one-click deployment

---

## Appendix A: Default Dashboard Configuration

The initial dashboard ships with a sensible default layout:

```json
{
  "widgets": [
    {
      "id": "welcome-header",
      "type": "title-header",
      "title": "",
      "options": {
        "headingLevel": "h1",
        "textAlign": "center",
        "showDivider": false,
        "content": "🏠 NanshanNav"
      }
    },
    {
      "id": "search-main",
      "type": "search-box",
      "title": "",
      "options": {
        "defaultEngine": "google",
        "enableLocalSearch": true,
        "placeholder": "Search or press Ctrl+K...",
        "ctrlKEnabled": true
      }
    },
    {
      "id": "clock-main",
      "type": "clock",
      "title": "",
      "options": {
        "displayMode": "digital",
        "timezone": "Asia/Shanghai",
        "showSeconds": false,
        "showDate": true,
        "dateFormat": "YYYY-MM-DD dddd",
        "is24Hour": true
      }
    }
  ],
  "layouts": {
    "lg": [
      { "i": "welcome-header", "x": 0, "y": 0, "w": 12, "h": 1 },
      { "i": "search-main", "x": 0, "y": 1, "w": 6, "h": 2 },
      { "i": "clock-main", "x": 6, "y": 1, "w": 6, "h": 2 }
    ]
  }
}
```

## Appendix B: Environment Variables

```bash
# .env (not committed)
VITE_PVE_API_TOKEN=monitor@pve!dashboard=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# .env.example (committed)
VITE_PVE_API_TOKEN=user@realm!tokenid=secret
```

---

*Document version: 1.0 | Last updated: 2026-05-26*
