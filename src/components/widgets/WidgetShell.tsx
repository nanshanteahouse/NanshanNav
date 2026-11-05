import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  Settings,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { useDashboardStore } from "@/store/index";
import { getWidgetDefinition } from "@/registry/index";
import { getWidgetDisplayKey } from "@/registry/loaders";
import { COLS } from "@/lib/constants";
import type { Breakpoint } from "@/lib/constants";
import type { WidgetConfig } from "@/types/widget";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import WidgetSettings from "@/components/widgets/WidgetSettings";
import { useTranslation } from "@/i18n";

export interface WidgetShellProps {
  widget: WidgetConfig;
  children: ReactNode;
}

export function WidgetShell({ widget, children }: WidgetShellProps) {
  const isEditMode = useDashboardStore((s) => s.editMode);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const clipboard = useDashboardStore((s) => s.clipboard);
  const selectedId = useDashboardStore((s) => s.lastInteractedWidgetId);
  const selectWidget = useDashboardStore((s) => s.setLastInteractedWidgetId);
  const breakpoint = useDashboardStore(
    (s) => s.currentBreakpoint,
  ) as Breakpoint;
  const layout = useDashboardStore((s) => s.layouts[breakpoint]);
  const [showSettings, setShowSettings] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { t } = useTranslation();
  const selected = selectedId === widget.id;
  const definition = getWidgetDefinition(widget.type);
  const displayKey = getWidgetDisplayKey(widget.type);
  const displayTitle =
    widget.title || (displayKey ? t(displayKey) : definition.displayName);
  const item = layout?.find((entry) => entry.i === widget.id);

  const handleOptionsChange = useCallback(
    (newOptions: Record<string, unknown>) => {
      useDashboardStore
        .getState()
        .updateWidget(widget.id, { options: newOptions });
    },
    [widget.id],
  );

  const changeLayout = (changes: { w?: number; h?: number; y?: number }) => {
    if (!item) return;
    const state = useDashboardStore.getState();
    const next = { ...item, ...changes };
    const cols = COLS[breakpoint];
    next.w = Math.max(
      Math.min(item.minW ?? 1, cols),
      Math.min(next.w, item.maxW ?? cols, cols),
    );
    next.h = Math.max(item.minH ?? 1, Math.min(next.h, item.maxH ?? 100));
    next.x = Math.max(0, Math.min(next.x, cols - next.w));
    next.y = Math.max(0, next.y);
    if (next.w === item.w && next.h === item.h && next.y === item.y) return;
    state.pushSnapshot({ widgets: state.widgets, layouts: state.layouts });
    // Moving up past a neighbour swaps their vertical positions. Moving down
    // leaves room above, so grid compaction cannot immediately undo the move.
    const current = state.layouts[breakpoint];
    const neighbour =
      changes.y === undefined
        ? undefined
        : current
            .filter(
              (entry) =>
                entry.i !== item.i &&
                (changes.y! < item.y ? entry.y < item.y : entry.y > item.y),
            )
            .sort((a, b) => (changes.y! < item.y ? b.y - a.y : a.y - b.y))[0];
    state.updateLayoutForBreakpoint(
      breakpoint,
      current.map((entry) => {
        if (entry.i === item.i)
          return neighbour ? { ...next, y: neighbour.y } : next;
        if (entry.i === neighbour?.i) return { ...entry, y: item.y };
        return entry;
      }),
    );
  };

  if (!isEditMode) {
    return (
      <div
        data-widget-type={widget.type}
        data-widget-id={widget.id}
        className="widget-body h-full overflow-hidden scrollbar-thin border border-transparent"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-widget-type={widget.type}
      data-widget-id={widget.id}
      data-selected={selected}
      tabIndex={0}
      onPointerDownCapture={() => selectWidget(widget.id)}
      onFocusCapture={() => selectWidget(widget.id)}
      aria-label={displayTitle}
      className="widget-editor group relative flex flex-col h-full rounded-[var(--radius-default)] bg-[var(--bg-widget)] shadow-[var(--shadow-widget)] border border-[var(--border-default)] overflow-hidden"
    >
      <div
        className="widget-drag-handle flex h-11 min-h-11 items-center border-b border-[var(--border-default)] bg-[var(--bg-widget-hover)] pl-2"
        aria-label={t("widgetShell.editControls", { title: displayTitle })}
      >
        <GripVertical
          className="widget-grip h-4 w-4 shrink-0 text-[var(--text-secondary)]"
          aria-hidden="true"
        />
        <span className="flex-1 min-w-0 truncate text-sm font-medium px-1">
          {displayTitle}
        </span>
        <div className="edit-controls flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="widget-settings-trigger"
            onClick={() => setShowSettings(true)}
            aria-label={t("widgetShell.settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowActions(true)}
            aria-label={t("widgetShell.moreOptions")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="widget-body min-h-0 overflow-hidden scrollbar-thin">
        {children}
      </div>
      <Modal
        open={showActions}
        onClose={() => setShowActions(false)}
        title={displayTitle}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => useDashboardStore.getState().copyWidget(widget)}
            aria-label={t("widgetShell.copy")}
          >
            <Copy className="h-4 w-4" />
            {t("widgetShell.copy")}
          </Button>
          <Button
            variant="outline"
            onClick={() => useDashboardStore.getState().pasteWidget(breakpoint)}
            disabled={!clipboard}
            aria-label={t("widgetShell.paste")}
          >
            <ClipboardPaste className="h-4 w-4" />
            {t("widgetShell.paste")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              useDashboardStore
                .getState()
                .duplicateWidget(widget.id, breakpoint)
            }
            aria-label={t("widgetShell.duplicate")}
          >
            <CopyPlus className="h-4 w-4" />
            {t("widgetShell.duplicate")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowActions(false);
              setShowSettings(true);
            }}
          >
            <Settings className="h-4 w-4" />
            {t("widgetShell.settings")}
          </Button>
        </div>
        {item && (
          <fieldset className="mt-6 space-y-3">
            <legend className="text-sm font-semibold mb-3">
              {t("widgetShell.layout")}
            </legend>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => changeLayout({ y: item.y - 1 })}
                disabled={item.y === 0}
              >
                <ArrowUp className="h-4 w-4" />
                {t("widgetShell.moveUp")}
              </Button>
              <Button
                variant="outline"
                onClick={() => changeLayout({ y: item.y + item.h })}
              >
                <ArrowDown className="h-4 w-4" />
                {t("widgetShell.moveDown")}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm flex flex-col gap-2">
                {t("widgetShell.width")}
                <input
                  type="number"
                  min={Math.min(item.minW ?? 1, COLS[breakpoint])}
                  max={Math.min(
                    item.maxW ?? COLS[breakpoint],
                    COLS[breakpoint],
                  )}
                  value={item.w}
                  onChange={(event) => {
                    if (event.target.value)
                      changeLayout({ w: Number(event.target.value) });
                  }}
                  className="min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3"
                />
              </label>
              <label className="text-sm flex flex-col gap-2">
                {t("widgetShell.height")}
                <input
                  type="number"
                  min={item.minH ?? 1}
                  max={item.maxH ?? 100}
                  value={item.h}
                  onChange={(event) => {
                    if (event.target.value)
                      changeLayout({ h: Number(event.target.value) });
                  }}
                  className="min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3"
                />
              </label>
            </div>
          </fieldset>
        )}
        <Button
          variant="ghost"
          className="mt-6 text-[var(--status-offline)]"
          onClick={() => {
            removeWidget(widget.id);
            setShowActions(false);
          }}
        >
          <Trash2 className="h-4 w-4" />
          {t("widgetShell.delete")}
        </Button>
      </Modal>
      <WidgetSettings
        widgetId={widget.id}
        options={widget.options}
        onChange={handleOptionsChange}
        onClose={() => setShowSettings(false)}
        open={showSettings}
      />
    </div>
  );
}
