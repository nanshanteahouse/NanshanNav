import { useCallback, useRef, useMemo, useEffect } from "react";
import {
  Responsive,
  useContainerWidth,
  getBreakpointFromWidth,
} from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { useDashboardStore } from "@/store/index";
import { BREAKPOINTS, COLS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { getWidgetDefinition } from "@/registry/index";
import type { LayoutItem } from "@/types/layout";
import { useTranslation } from "@/i18n";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Snapshot } from "@/types/history";

const MARGIN_X = 12;
const MARGIN_Y = 12;
const PADDING = 12;

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export function DashboardCanvas() {
  const { width, containerRef, mounted } = useContainerWidth();
  const isTouchDevice = useMediaQuery("(hover: none)");
  const gestureSnapshot = useRef<Snapshot | null>(null);
  const dropPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { t } = useTranslation();

  const widgets = useDashboardStore((s) => s.widgets);
  const editMode = useDashboardStore((s) => s.editMode);
  const layouts = useDashboardStore((s) => s.layouts);
  const cellSize = useDashboardStore((s) => s.settings.cellSize);
  const showGridLines = useDashboardStore((s) => s.settings.showGridLines);
  const updateLayoutForBreakpoint = useDashboardStore(
    (s) => s.updateLayoutForBreakpoint,
  );
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const setCurrentBreakpoint = useDashboardStore((s) => s.setCurrentBreakpoint);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const syncError = useDashboardStore((s) => s.syncError);
  const managementAvailable = useDashboardStore(
    (s) => s.capabilitiesStatus === "ready" && !s.readOnly,
  );

  const bp = useMemo(() => getBreakpointFromWidth(BREAKPOINTS, width), [width]);
  useEffect(() => {
    if (mounted && width > 0) setCurrentBreakpoint(bp);
  }, [bp, mounted, width, setCurrentBreakpoint]);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      const next = layout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: Math.min(item.w, COLS[bp]),
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static,
      })) as LayoutItem[];
      const state = useDashboardStore.getState();
      if (gestureSnapshot.current) updateLayoutForBreakpoint(bp, next);
      else state.setGeneratedLayouts({ ...state.layouts, [bp]: next });
    },
    [updateLayoutForBreakpoint, bp],
  );

  const startGesture = useCallback(() => {
    const state = useDashboardStore.getState();
    gestureSnapshot.current = {
      widgets: state.widgets,
      layouts: state.layouts,
    };
  }, []);
  const finishGesture = useCallback(
    (layout: Layout) => {
      const snapshot = gestureSnapshot.current;
      if (!snapshot) return;
      const before = snapshot.layouts[bp] ?? [];
      const changed = layout.some((item) => {
        const old = before.find((entry) => entry.i === item.i);
        return (
          !old ||
          old.x !== item.x ||
          old.y !== item.y ||
          old.w !== item.w ||
          old.h !== item.h
        );
      });
      if (changed) {
        useDashboardStore.getState().pushSnapshot(snapshot);
        handleLayoutChange(layout);
      }
      gestureSnapshot.current = null;
    },
    [bp, handleLayoutChange],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cols = COLS[bp];
      const usableWidth = rect.width - MARGIN_X * (cols - 1) - PADDING * 2;
      const colW = safeDiv(usableWidth, cols);
      const rowH = cellSize + MARGIN_Y;

      const relX = e.clientX - rect.left - PADDING;
      const relY = e.clientY - rect.top - PADDING;

      const gridX = Math.max(0, Math.floor(safeDiv(relX, colW + MARGIN_X)));
      const gridY = Math.max(0, Math.floor(safeDiv(relY, rowH)));

      dropPositionRef.current = { x: gridX, y: gridY };
    },
    [editMode, cellSize, containerRef, bp],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!editMode) return;

      const widgetType = e.dataTransfer.getData("widget-type");
      if (!widgetType) return;

      const def = getWidgetDefinition(
        widgetType as Parameters<typeof getWidgetDefinition>[0],
      );
      if (!def) return;

      const id = addWidget({
        type: widgetType as Parameters<typeof addWidget>[0]["type"],
        title: "",
        options: { ...def.defaultOptions },
      });

      const pos = dropPositionRef.current;
      const newItem: LayoutItem = {
        i: id,
        x: pos.x,
        y: pos.y,
        w: Math.min(def.defaultSize.w, COLS[bp]),
        h: def.defaultSize.h,
        minW: def.minSize ? Math.min(def.minSize.w, COLS[bp]) : undefined,
        minH: def.minSize?.h,
      };

      const current = [...(layouts[bp] ?? [])];
      current.push(newItem);
      updateLayoutForBreakpoint(bp, current);
    },
    [editMode, layouts, bp, addWidget, updateLayoutForBreakpoint],
  );

  const gridLayout = useMemo(() => layouts[bp] ?? [], [layouts, bp]);

  // Compute CSS variables for background grid lines (Excel-style)
  const gridStyle = useMemo(() => {
    if (!showGridLines || !mounted || width === 0) return undefined;
    const cols = COLS[bp];
    const usableWidth = width - PADDING * 2 - MARGIN_X * (cols - 1);
    const colW = safeDiv(usableWidth, cols);
    return {
      "--grid-step-x": `${colW + MARGIN_X}px`,
      "--grid-step-y": `${cellSize + MARGIN_Y}px`,
      "--grid-offset": `${PADDING * 2}px`,
    } as React.CSSProperties;
  }, [showGridLines, mounted, width, bp, cellSize]);

  const gridItems = useMemo(() => {
    return widgets.map((widget) => {
      const item = gridLayout.find((i) => i.i === widget.id);
      if (item) {
        return (
          <div
            key={widget.id}
            data-grid={{
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
              minW: item.minW,
              minH: item.minH,
              maxW: item.maxW,
              maxH: item.maxH,
              static: item.static,
            }}
          >
            <WidgetCard widget={widget} />
          </div>
        );
      }
      // Widget not yet in this breakpoint's layout — use default size.
      // react-grid-layout's synchronizeLayoutWithChildren2 will compact and
      // assign a proper (x, y) position from the generated layout.
      const def = getWidgetDefinition(widget.type);
      return (
        <div
          key={widget.id}
          data-grid={{
            w: Math.min(def.defaultSize.w, COLS[bp]),
            h: def.defaultSize.h,
            minW: def.minSize ? Math.min(def.minSize.w, COLS[bp]) : undefined,
            minH: def.minSize?.h,
          }}
        >
          <WidgetCard widget={widget} />
        </div>
      );
    });
  }, [widgets, gridLayout, bp]);

  // Disable CSS transitions during window resize to avoid visual glitches.
  // The class is removed after a 100ms debounce so transitions re-enable
  // only after the user stops resizing.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      document.documentElement.classList.add("resizing");
      clearTimeout(timer);
      timer = setTimeout(() => {
        document.documentElement.classList.remove("resizing");
      }, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  if (!mounted) {
    return (
      <div ref={containerRef} className="flex-1">
        <div className="w-full h-32 rounded-[var(--radius-default)] bg-[var(--bg-input)] animate-pulse" />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn("flex-1 flex items-center justify-center")}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl" aria-hidden="true">
            🏠
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {t("dashboard.emptyTitle")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("dashboard.emptyDescription")}
          </p>
          {syncError && <p role="alert">{syncError}</p>}
          {editMode && managementAvailable && (
            <Button
              variant="default"
              size="default"
              aria-label={t("dashboard.startEditing")}
              onClick={() => {
                setSidebarOpen(true);
              }}
            >
              {t("dashboard.startEditing")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-auto p-3 relative",
        showGridLines && "grid-lines-visible",
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={gridStyle}
    >
      <Responsive
        layouts={layouts as unknown as Record<string, Layout>}
        breakpoints={BREAKPOINTS}
        cols={COLS as Record<string, number>}
        width={width}
        rowHeight={cellSize}
        margin={[MARGIN_X, MARGIN_Y] as [number, number]}
        containerPadding={[PADDING, PADDING] as [number, number]}
        onLayoutChange={handleLayoutChange}
        onDragStart={startGesture}
        onDragStop={finishGesture}
        onResizeStart={startGesture}
        onResizeStop={finishGesture}
        dragConfig={{
          enabled: editMode && !isTouchDevice,
          handle: ".widget-drag-handle",
          cancel: "button, input, select, textarea",
        }}
        resizeConfig={{
          enabled: editMode && !isTouchDevice,
        }}
      >
        {gridItems}
      </Responsive>
    </div>
  );
}
