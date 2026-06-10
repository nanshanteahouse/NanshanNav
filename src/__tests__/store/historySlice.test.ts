import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '@/store/index';
import type { Snapshot } from '@/types/history';
import type { WidgetConfig } from '@/types/widget';
import type { DashboardLayouts } from '@/types/layout';

/** Helper: create a minimal WidgetConfig with given id. */
const widget = (id: string, title?: string): WidgetConfig => ({
  id,
  type: 'clock',
  title: title ?? `Widget ${id}`,
  options: {},
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

/** Helper: create a layout entry with given id at (x,y). */
const layoutEntry = (i: string, x = 0, y = 0) => ({ i, x, y, w: 3, h: 2 });

const emptyLayouts: DashboardLayouts = {
  lg: [], md: [], sm: [], xs: [], xxs: [],
};

const snapshot = (widgets: WidgetConfig[], layouts?: DashboardLayouts): Snapshot => ({
  widgets,
  layouts: layouts ?? emptyLayouts,
});

const emptySnapshot: Snapshot = { widgets: [], layouts: emptyLayouts };

describe('historySlice', () => {
  beforeEach(() => {
    // Reset history + widgets + layouts so tests have a clean slate
    useDashboardStore.setState({
      history: { past: [], future: [] },
      widgets: [],
      layouts: { ...emptyLayouts },
    });
  });

  it('should initialize with empty past and future', () => {
    const { history } = useDashboardStore.getState();
    expect(history.past).toEqual([]);
    expect(history.future).toEqual([]);
  });

  it('pushSnapshot should add snapshot to past', () => {
    const snap = snapshot([widget('w1')], { ...emptyLayouts, lg: [layoutEntry('w1')] });
    useDashboardStore.getState().pushSnapshot(snap);

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(1);
    expect(history.past[0]).toEqual(snap);
    expect(history.future).toEqual([]);
  });

  it('pushSnapshot should cap past at 50 entries (FIFO eviction)', () => {
    for (let i = 1; i <= 51; i++) {
      useDashboardStore.getState().pushSnapshot(snapshot([widget(`w${i}`)]));
    }

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(50);

    const ids = history.past.map((s) => s.widgets[0].id);
    expect(ids).not.toContain('w1');
    expect(ids).toContain('w51');
  });

  it('undo should pop from past, push current to future, return restored Snapshot', () => {
    // Current store state = w1
    useDashboardStore.setState({
      widgets: [widget('w1')],
      layouts: { ...emptyLayouts, lg: [layoutEntry('w1')] },
    });

    // Push a previous snapshot (the state BEFORE w1 was added)
    useDashboardStore.getState().pushSnapshot(emptySnapshot);

    // Undo: should return the empty snapshot, and save w1 state to future
    const result = useDashboardStore.getState().undo();
    expect(result).toEqual(emptySnapshot);

    const { history } = useDashboardStore.getState();
    expect(history.past).toEqual([]);
    expect(history.future).toHaveLength(1);

    // future[0] should be the CURRENT store state (w1)
    expect(history.future[0].widgets[0].id).toBe('w1');
  });

  it('redo should pop from future, push current to past, return forward Snapshot', () => {
    // Current store state = empty (after undo)
    useDashboardStore.setState({
      widgets: [],
      layouts: { ...emptyLayouts },
    });

    // Manually set up: past has emptySnapshot, future has w1 state
    const w1Snap = snapshot([widget('w1')], { ...emptyLayouts, lg: [layoutEntry('w1')] });
    useDashboardStore.setState({
      history: {
        past: [emptySnapshot],
        future: [w1Snap],
      },
    });

    // Redo: should return w1 state, and save current (empty) to past
    const result = useDashboardStore.getState().redo();
    expect(result).toEqual(w1Snap);

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(2);
    expect(history.future).toEqual([]);

    // past[1] should be the CURRENT store state (empty) saved during redo
    expect(history.past[1]).toEqual(emptySnapshot);
  });

  it('undo on empty past should return null', () => {
    const result = useDashboardStore.getState().undo();
    expect(result).toBeNull();
  });

  it('redo on empty future should return null', () => {
    const result = useDashboardStore.getState().redo();
    expect(result).toBeNull();
  });

  it('pushSnapshot after undo should clear future (standard undo semantics)', () => {
    // Push two snapshots
    const snap1 = snapshot([widget('w1')], { ...emptyLayouts, lg: [layoutEntry('w1')] });
    const snap2 = snapshot([widget('w2')], { ...emptyLayouts, lg: [layoutEntry('w2')] });
    const snap3 = snapshot([widget('w3')], { ...emptyLayouts, lg: [layoutEntry('w3')] });

    useDashboardStore.getState().pushSnapshot(snap1); // past: [s1]
    useDashboardStore.getState().pushSnapshot(snap2); // past: [s1, s2]

    // Set current store to empty so undo saves empty to future
    useDashboardStore.setState({ widgets: [], layouts: { ...emptyLayouts } });

    useDashboardStore.getState().undo(); // past: [s1], future: [current=empty]

    // Now push a new snapshot — should clear future
    useDashboardStore.getState().pushSnapshot(snap3);

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(2);
    expect(history.past[0]).toEqual(snap1);
    expect(history.past[1]).toEqual(snap3);
    expect(history.future).toEqual([]);
  });

  it('full undo→redo round-trip should restore original state', () => {
    // State A = empty, State B = w1
    const stateB = snapshot([widget('w1')], { ...emptyLayouts, lg: [layoutEntry('w1')] });

    // Current store = state B
    useDashboardStore.setState({
      widgets: stateB.widgets,
      layouts: stateB.layouts,
    });

    // Push state A (recording the empty state before moving to B)
    useDashboardStore.getState().pushSnapshot(emptySnapshot);

    // Undo: returns A, saves B (current) to future
    const undoResult = useDashboardStore.getState().undo();
    expect(undoResult).toEqual(emptySnapshot);

    // After undo: past=[], future=[B]
    expect(useDashboardStore.getState().history.past).toEqual([]);
    expect(useDashboardStore.getState().history.future).toHaveLength(1);

    // Redo: returns B, saves current (still B since slice didn't change it) to past
    const redoResult = useDashboardStore.getState().redo();
    expect(redoResult).toEqual(stateB);

    // Final state: past=[B] (B saved as "current" during redo), future=[]
    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(1);
    expect(history.past[0]).toEqual(stateB);
    expect(history.future).toEqual([]);
  });
});
