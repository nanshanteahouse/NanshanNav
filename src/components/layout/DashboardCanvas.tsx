import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useServerSync } from '@/hooks/useServerSync';
import type { AuthState } from '@/hooks/useServerSync';
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
import { useTranslation } from '@/i18n';

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
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  const dropPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { t } = useTranslation();

  const widgets = useDashboardStore((s) => s.widgets);
  const editMode = useDashboardStore((s) => s.editMode);
  const layouts = useDashboardStore((s) => s.layouts);
  const cellSize = useDashboardStore((s) => s.settings.cellSize);
  const showGridLines = useDashboardStore((s) => s.settings.showGridLines);
  const updateLayoutForBreakpoint = useDashboardStore((s) => s.updateLayoutForBreakpoint);
  const setEditMode = useDashboardStore((s) => s.setEditMode);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const { authState } = useServerSync();

  const bp = useMemo(() => getBreakpoint(width), [width]);
  const MAX_COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      updateLayoutForBreakpoint(
        bp,
        layout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: Math.min(item.w, MAX_COLS[bp]),
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
        w: Math.min(def.defaultSize.w, MAX_COLS[bp]),
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

  // Compute CSS variables for background grid lines (Excel-style)
  const gridStyle = useMemo(() => {
    if (!showGridLines || !mounted || width === 0) return undefined;
    const cols = COLS[bp];
    const usableWidth = width - PADDING * 2 - MARGIN_X * (cols - 1);
    const colW = safeDiv(usableWidth, cols);
    return {
      '--grid-step-x': `${colW + MARGIN_X}px`,
      '--grid-step-y': `${cellSize + MARGIN_Y}px`,
      '--grid-offset': `${PADDING * 2}px`,
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
            w: def.defaultSize.w,
            h: def.defaultSize.h,
          }}
        >
          <WidgetCard widget={widget} />
        </div>
      );
    });
  }, [widgets, gridLayout]);

  // Disable CSS transitions during window resize to avoid visual glitches.
  // The class is removed after a 100ms debounce so transitions re-enable
  // only after the user stops resizing.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      document.documentElement.classList.add('resizing');
      clearTimeout(timer);
      timer = setTimeout(() => {
        document.documentElement.classList.remove('resizing');
      }, 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
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
        className={cn('flex-1 flex items-center justify-center')}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {authState === 'unauthenticated' ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl" aria-hidden="true">🏠</div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {t('dashboard.emptyTitle')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              登录后可加载已保存的面板配置
            </p>
            <Button
              variant="default"
              size="default"
              onClick={() => { window.location.href = '/admin'; }}
            >
              登录加载配置
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              或{' '}
              <button
                type="button"
                className="underline cursor-pointer"
                style={{ color: 'var(--accent-primary)' }}
                onClick={() => {
                  setEditMode(true);
                  setSidebarOpen(true);
                }}
              >
                开始编辑
              </button>
              {' '}全新配置
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl" aria-hidden="true">🏠</div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {t('dashboard.emptyTitle')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('dashboard.emptyDescription')}
            </p>
            <Button
              variant="default"
              size="default"
              aria-label={t('dashboard.startEditing')}
              onClick={() => {
                setEditMode(true);
                setSidebarOpen(true);
              }}
            >
              {t('dashboard.startEditing')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 overflow-auto p-3 relative', showGridLines && 'grid-lines-visible')}
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
        dragConfig={{
          enabled: editMode && !isTouchDevice,
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
