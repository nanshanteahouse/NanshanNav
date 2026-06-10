import type { WidgetConfig } from './widget.ts';
import type { DashboardLayouts, LayoutItem } from './layout.ts';

// ── Snapshot: captures the full widget + layout state at a point in time ──

export interface Snapshot {
  /** Widget configurations at the point of snapshot */
  widgets: WidgetConfig[];
  /** Grid layouts for all breakpoints at the point of snapshot */
  layouts: DashboardLayouts;
}

// ── HistoryEntry: undo/redo state container ──

export interface HistoryEntry {
  /** Past snapshots (most recent last) */
  past: Snapshot[];
  /** Future snapshots (most recent last) for redo */
  future: Snapshot[];
}

// ── ClipboardState: copied widgets for copy/paste/duplicate ──

export interface ClipboardState {
  /** Copied widget configurations */
  widgets: WidgetConfig[];
  /** Copied layout items corresponding to the widgets */
  layoutItems: LayoutItem[];
}
