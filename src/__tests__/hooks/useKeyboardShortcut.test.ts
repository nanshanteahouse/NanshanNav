/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStore } from '@/store/index';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import type { Snapshot } from '@/types/history';
import type { DashboardLayouts } from '@/types/layout';

const emptyLayouts: DashboardLayouts = {
  lg: [], md: [], sm: [], xs: [], xxs: [],
};

function fireCtrlKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true }));
}

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      editMode: false,
      lastInteractedWidgetId: null,
      currentBreakpoint: 'lg',
      history: { past: [], future: [] },
      widgets: [],
      layouts: { ...emptyLayouts },
      clipboard: null,
    });
  });

  afterEach(() => {
    // Clean up any stray input elements
    document.body.innerHTML = '';
  });

  // ─── Undo (Ctrl+Z) ───────────────────────────────────────────

  it('Ctrl+Z fires undo() when editMode=true', () => {
    // Set up history with one past snapshot
    const pastSnapshot: Snapshot = { widgets: [], layouts: emptyLayouts };
    useDashboardStore.setState({
      editMode: true,
      history: { past: [pastSnapshot], future: [] },
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('z');

    // undo popped the past entry
    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(0);
    expect(history.future).toHaveLength(1); // current state saved
  });

  it('Ctrl+Z no-op when editMode=false', () => {
    useDashboardStore.setState({
      editMode: false,
      history: { past: [{ widgets: [], layouts: emptyLayouts }], future: [] },
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('z');

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(1); // unchanged
    expect(history.future).toHaveLength(0);
  });

  it('Ctrl+Z no-op when input is focused', () => {
    useDashboardStore.setState({
      editMode: true,
      history: { past: [{ widgets: [], layouts: emptyLayouts }], future: [] },
    });

    // Create an input and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('z');

    const { history } = useDashboardStore.getState();
    expect(history.past).toHaveLength(1); // unchanged
    expect(history.future).toHaveLength(0);

    document.body.removeChild(input);
  });

  // ─── Redo (Ctrl+Y) ───────────────────────────────────────────

  it('Ctrl+Y fires redo() when editMode=true', () => {
    const futureSnapshot: Snapshot = {
      widgets: [{ id: 'w1', type: 'clock', title: 'T', options: {}, createdAt: '', updatedAt: '' }],
      layouts: emptyLayouts,
    };
    useDashboardStore.setState({
      editMode: true,
      history: { past: [], future: [futureSnapshot] },
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('y');

    const { history } = useDashboardStore.getState();
    expect(history.future).toHaveLength(0); // popped
    expect(history.past).toHaveLength(1); // current saved
  });

  it('Ctrl+Y no-op when editMode=false', () => {
    useDashboardStore.setState({
      editMode: false,
      history: { past: [], future: [{ widgets: [], layouts: emptyLayouts }] },
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('y');

    const { history } = useDashboardStore.getState();
    expect(history.future).toHaveLength(1); // unchanged
  });

  it('Ctrl+Y no-op when input is focused', () => {
    useDashboardStore.setState({
      editMode: true,
      history: { past: [], future: [{ widgets: [], layouts: emptyLayouts }] },
    });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('y');

    const { history } = useDashboardStore.getState();
    expect(history.future).toHaveLength(1); // unchanged

    document.body.removeChild(input);
  });

  // ─── Copy (Ctrl+C) ───────────────────────────────────────────

  it('Ctrl+C copies lastInteractedWidget when editMode=true', () => {
    useDashboardStore.setState({
      editMode: true,
      lastInteractedWidgetId: 'w1',
      widgets: [{
        id: 'w1', type: 'clock', title: 'My Clock', options: {},
        createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
      }],
      clipboard: null,
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('c');

    const { clipboard } = useDashboardStore.getState();
    expect(clipboard).not.toBeNull();
    expect(clipboard!.id).toBe('w1');
  });

  it('Ctrl+C no-op when no lastInteractedWidgetId', () => {
    useDashboardStore.setState({
      editMode: true,
      lastInteractedWidgetId: null,
      clipboard: null,
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('c');

    expect(useDashboardStore.getState().clipboard).toBeNull();
  });

  // ─── Paste (Ctrl+V) ──────────────────────────────────────────

  it('Ctrl+V pastes from clipboard when editMode=true', () => {
    useDashboardStore.setState({
      editMode: true,
      clipboard: {
        id: 'clip-src', type: 'clock', title: 'Pasted', options: {},
        createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
      },
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('v');

    const { widgets } = useDashboardStore.getState();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].title).toBe('Pasted');
    expect(widgets[0].id).not.toBe('clip-src');
  });

  // ─── Duplicate (Ctrl+D) ──────────────────────────────────────

  it('Ctrl+D duplicates lastInteractedWidget when editMode=true', () => {
    const originalId = useDashboardStore.getState().addWidget({
      type: 'clock', title: 'Dup Clock', options: {},
    });
    useDashboardStore.getState().updateLayoutForBreakpoint('lg', [
      { i: originalId, x: 0, y: 0, w: 4, h: 4 },
    ]);
    useDashboardStore.setState({
      editMode: true,
      lastInteractedWidgetId: originalId,
    });

    renderHook(() => useKeyboardShortcut());
    fireCtrlKey('d');

    const { widgets } = useDashboardStore.getState();
    expect(widgets).toHaveLength(2);
  });

  // ─── Ctrl+K regression ───────────────────────────────────────

  it('Ctrl+K still focuses search input (regression)', () => {
    // Create a container with data-widget-type="search-box" and an input inside
    const container = document.createElement('div');
    container.setAttribute('data-widget-type', 'search-box');
    const searchInput = document.createElement('input');
    container.appendChild(searchInput);
    document.body.appendChild(container);

    renderHook(() => useKeyboardShortcut());

    // Focus something else first
    const otherInput = document.createElement('input');
    document.body.appendChild(otherInput);
    otherInput.focus();
    expect(document.activeElement).toBe(otherInput);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

    expect(document.activeElement).toBe(searchInput);

    document.body.removeChild(container);
    document.body.removeChild(otherInput);
  });
});
