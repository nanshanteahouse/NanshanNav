/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '@/store/index';
import type { LayoutItem } from '@/types/layout';

const EMPTY_LAYOUTS = {
  lg: [] as LayoutItem[],
  md: [] as LayoutItem[],
  sm: [] as LayoutItem[],
  xs: [] as LayoutItem[],
  xxs: [] as LayoutItem[],
};

const makeItem = (i: string, overrides?: Partial<LayoutItem>): LayoutItem => ({
  i,
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  ...overrides,
});

describe('layoutSlice', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      layouts: EMPTY_LAYOUTS,
    });
  });

  describe('addLayoutEntry', () => {
    it('should add a layout entry to an empty breakpoint', () => {
      const item = makeItem('widget-1');
      useDashboardStore.getState().addLayoutEntry('lg', item);

      const layouts = useDashboardStore.getState().layouts;
      expect(layouts.lg).toHaveLength(1);
      expect(layouts.lg[0]).toEqual(item);
    });

    it('should append to an existing breakpoint', () => {
      const item1 = makeItem('widget-1', { x: 0, y: 0 });
      const item2 = makeItem('widget-2', { x: 2, y: 0 });

      useDashboardStore.getState().addLayoutEntry('lg', item1);
      useDashboardStore.getState().addLayoutEntry('lg', item2);

      const layouts = useDashboardStore.getState().layouts;
      expect(layouts.lg).toHaveLength(2);
      expect(layouts.lg[0]).toEqual(item1);
      expect(layouts.lg[1]).toEqual(item2);
    });

    it('should not affect other breakpoints', () => {
      const item = makeItem('widget-1');
      useDashboardStore.getState().addLayoutEntry('lg', item);

      const layouts = useDashboardStore.getState().layouts;
      expect(layouts.lg).toHaveLength(1);
      expect(layouts.md).toHaveLength(0);
      expect(layouts.sm).toHaveLength(0);
      expect(layouts.xs).toHaveLength(0);
      expect(layouts.xxs).toHaveLength(0);
    });

    it('should initialize a breakpoint array if the key does not exist', () => {
      const item = makeItem('widget-1');
      // Add to a breakpoint that's initially empty — this implicitly tests
      // the fallback to empty array when the key doesn't exist
      useDashboardStore.getState().addLayoutEntry('xxs', item);

      const layouts = useDashboardStore.getState().layouts;
      expect(layouts.xxs).toHaveLength(1);
      expect(layouts.xxs[0]).toEqual(item);
    });
  });
});
