import { useCallback, useRef, useMemo } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetCard } from '@/components/widgets/WidgetCard';
import { useDashboardStore } from '@/store/index';
import { BREAKPOINTS, COLS } from '@/lib/constants';
import type { Breakpoint } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { getWidgetDefinition } from '@/registry/index';
import type { LayoutItem } from '@/types/layout';

const MARGIN_X = 12;
const MARGIN_Y = 12;
const PADDING = 12;

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function getBreakpoint(width: number): Breakpoint {
  const sorted = (Object.entries(BREAKPOINTS) as [Breakpoint, number][]).sort(
    ([, a], [, b]) => b - a,
  );
  for (const [name] of sorted) {
    if (width >= BREAKPOINTS[name]) return name;
  }
  return 'xxs';
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export function DashboardCanvas() {
  const { width, containerRef, mounted } = useContainerWidth();
  const dropPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const widgets = useDashboardStore((s) => s.widgets);
  const editMode = useDashboardStore((s) => s.editMode);
  const layouts = useDashboardStore((s) => s.layouts);
  const cellSize = useDashboardStore((s) => s.settings.cellSize);
  const showGridLines = useDashboardStore((s) => s.settings.showGridLines);
  const updateLayoutForBreakpoint = useDashboardStore((s) => s.updateLayoutForBreakpoint);
  const setEditMode = useDashboardStore((s) => s.setEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const addWidget = useDashboardStore((s) => s.addWidget);

  const bp = useMemo(() => getBreakpoint(width), [width]);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      updateLayoutForBreakpoint(
        bp,
        layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
          maxW: item.maxW,
          maxH: item.maxH,
          static: item.static,
        })) as LayoutItem[],
      );
    },
    [updateLayoutForBreakpoint, bp],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';

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

      const widgetType = e.dataTransfer.getData('widget-type');
      if (!widgetType) return;

      const def = getWidgetDefinition(widgetType as Parameters<typeof getWidgetDefinition>[0]);
      if (!def) return;

      const id = addWidget({
        type: widgetType as Parameters<typeof addWidget>[0]['type'],
        title: '',
        options: { ...def.defaultOptions },
      });

      const pos = dropPositionRef.current;
      const newItem: LayoutItem = {
        i: id,
        x: pos.x,
        y: pos.y,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        minW: def.minSize?.w,
        minH: def.minSize?.h,
      };

      const current = [...(layouts[bp] ?? [])];
      current.push(newItem);
      updateLayoutForBreakpoint(bp, current);
    },
    [editMode, layouts, bp, addWidget, updateLayoutForBreakpoint],
  );

  const gridLayout = useMemo(() => layouts[bp] ?? [], [layouts, bp]);

  const gridItems = useMemo(() => {
    const layoutIds = new Set(gridLayout.map((i) => i.i));
    return widgets
      .filter((w) => layoutIds.has(w.id))
      .map((widget) => {
        const item = gridLayout.find((i) => i.i === widget.id)!;
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
      });
  }, [widgets, gridLayout]);

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
        className={cn('flex-1 flex items-center justify-center')}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl" aria-hidden="true">🏠</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Welcome to NanshanNav
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Your dashboard is empty. Click <strong>Edit</strong> to start adding widgets.
          </p>
          <Button
            variant="default"
            size="default"
            aria-label="Start editing dashboard"
            onClick={() => {
              setEditMode(true);
              setSidebarOpen(true);
            }}
          >
            Start Editing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 overflow-auto p-4', showGridLines && 'grid-lines-visible')}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
        dragConfig={{
          enabled: editMode,
        }}
        resizeConfig={{
          enabled: editMode,
        }}
      >
        {gridItems}
      </Responsive>
    </div>
  );
}
